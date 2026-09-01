import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchContext } from "@/contexts/BranchContext";
import { useOffline } from "@/contexts/OfflineContext";
import { offlineDb } from "@/lib/offlineDb";
import { recordOfflineClockIn, recordOfflineClockOut, cacheAttendance, processOutboxSync } from "@/lib/offlineSyncEngine";
import { toast } from "sonner";
import type { AttendanceRecord, AttendanceSummary, ClockInPayload, ClockOutPayload, BreakActionPayload } from "@/types/attendance";

export function useAttendance(businessId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedBranchId, allBranches, accessibleBranches } = useBranchContext();
  const { isOnline } = useOffline();

  const branchList = allBranches || accessibleBranches || [];

  // Periodically process any pending offline outbox records when online
  useEffect(() => {
    if (isOnline && businessId) {
      processOutboxSync().catch((e) => console.warn("Background attendance sync check failed:", e));
    }
  }, [isOnline, businessId]);

  // Query: Fetch all attendance records for the current business & branch filter
  const {
    data: attendanceRecords = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["attendance", businessId, selectedBranchId, isOnline],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (!businessId) return [];

      let remoteRecords: AttendanceRecord[] = [];

      if (isOnline) {
        try {
          let query = supabase
            .from("staff_attendance" as any)
            .select("*")
            .eq("business_id", businessId)
            .order("clock_in_time", { ascending: false });

          if (selectedBranchId && selectedBranchId !== "all") {
            query = query.eq("branch_id", selectedBranchId);
          }

          const { data, error } = await query;

          if (error) {
            console.warn("Could not query remote staff_attendance, falling back to local cache:", error.message);
          } else if (data) {
            remoteRecords = (data as any[]).map((r) => {
              const matchedBranch = branchList.find((b) => b?.id === r.branch_id);
              return {
                ...r,
                branch: matchedBranch ? { id: matchedBranch.id, name: matchedBranch.branch_name } : (r.branch || null),
                is_offline: false,
                synced: true,
              };
            });
            // Cache to local Dexie
            await cacheAttendance(remoteRecords);
          }
        } catch (err) {
          console.warn("Network error fetching attendance, checking local storage:", err);
        }
      }

      // Read from local Dexie IndexedDB
      try {
        let localQuery = offlineDb.attendance.where("business_id").equals(businessId);
        let localRecords = await localQuery.toArray();

        if (selectedBranchId && selectedBranchId !== "all") {
          localRecords = localRecords.filter((r) => r.branch_id === selectedBranchId);
        }

        // Merge remote and local (unsynced local entries take priority, otherwise remote is authoritative)
        const recordMap = new Map<string, AttendanceRecord>();

        remoteRecords.forEach((r) => recordMap.set(r.id, r));
        localRecords.forEach((loc) => {
          const matchedBranch = branchList.find((b) => b?.id === loc.branch_id);
          const isUnsynced = loc.synced === false || loc.is_offline;
          if (isUnsynced || !recordMap.has(loc.id)) {
            recordMap.set(loc.id, {
              ...loc,
              branch: loc.branch || (matchedBranch ? { id: matchedBranch.id, name: matchedBranch.branch_name } : null),
              is_offline: loc.is_offline ?? false,
              synced: loc.synced ?? true,
            } as AttendanceRecord);
          }
        });

        const merged = Array.from(recordMap.values()).sort(
          (a, b) => new Date(b.clock_in_time).getTime() - new Date(a.clock_in_time).getTime()
        );

        return merged;
      } catch {
        return remoteRecords;
      }
    },
    enabled: !!businessId,
    staleTime: 1000 * 15, // 15 seconds
  });

  // Active session for the currently logged in user
  const activeUserSession = attendanceRecords.find(
    (record) =>
      record.user_id === user?.id &&
      (record.status === "on_duty" || record.status === "on_break") &&
      !record.clock_out_time
  );

  // Calculate high-level summary metrics
  const summary: AttendanceSummary = {
    total_shifts: attendanceRecords.length,
    active_now: attendanceRecords.filter((r) => r.status === "on_duty").length,
    on_break: attendanceRecords.filter((r) => r.status === "on_break").length,
    total_hours_today: Math.round(
      (attendanceRecords
        .filter((r) => {
          const today = new Date().toISOString().split("T")[0];
          return r.clock_in_time.startsWith(today);
        })
        .reduce((sum, r) => {
          if (r.total_minutes) return sum + r.total_minutes;
          if (r.status === "on_duty" || r.status === "on_break") {
            const mins = Math.max(
              0,
              (new Date().getTime() - new Date(r.clock_in_time).getTime()) / 60000
            );
            return sum + mins;
          }
          return sum;
        }, 0) /
        60) *
        10
    ) / 10,
    average_shift_hours:
      attendanceRecords.filter((r) => r.total_minutes && r.total_minutes > 0).length > 0
        ? Math.round(
            (attendanceRecords.reduce((sum, r) => sum + (r.total_minutes || 0), 0) /
              attendanceRecords.filter((r) => r.total_minutes && r.total_minutes > 0).length /
              60) *
              10
          ) / 10
        : 0,
  };

  // Mutation: Clock In
  const clockInMutation = useMutation({
    mutationFn: async (payload: ClockInPayload) => {
      const now = new Date().toISOString();
      const deviceInfo =
        payload.device_info ||
        `${navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop"} (${
          isOnline ? "Online" : "Offline"
        })`;

      if (!isOnline) {
        return await recordOfflineClockIn({
          business_id: payload.business_id,
          branch_id: payload.branch_id || null,
          user_id: payload.user_id,
          staff_name: payload.staff_name,
          staff_email: payload.staff_email,
          staff_role: payload.staff_role,
          device_info: deviceInfo,
          notes: payload.notes,
        });
      }

      try {
        const { data, error } = await supabase
          .from("staff_attendance" as any)
          .insert({
            business_id: payload.business_id,
            branch_id: payload.branch_id || null,
            user_id: payload.user_id,
            staff_name: payload.staff_name,
            staff_email: payload.staff_email || null,
            staff_role: payload.staff_role || "staff",
            clock_in_time: now,
            status: "on_duty",
            clock_in_device_info: deviceInfo,
          })
          .select()
          .single();

        if (error) {
          // If remote fails, gracefully fallback to offline local store
          console.warn("Clock-in remote error, falling back to local:", error);
          return await recordOfflineClockIn({
            business_id: payload.business_id,
            branch_id: payload.branch_id || null,
            user_id: payload.user_id,
            staff_name: payload.staff_name,
            staff_email: payload.staff_email,
            staff_role: payload.staff_role,
            device_info: deviceInfo,
            notes: payload.notes,
          });
        }

        if (data) {
          await offlineDb.attendance.put({ ...(data as any), synced: true, is_offline: false });
        }
        return data;
      } catch {
        return await recordOfflineClockIn({
          business_id: payload.business_id,
          branch_id: payload.branch_id || null,
          user_id: payload.user_id,
          staff_name: payload.staff_name,
          staff_email: payload.staff_email,
          staff_role: payload.staff_role,
          device_info: deviceInfo,
          notes: payload.notes,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Clocked In successfully! Have a productive shift.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to clock in");
    },
  });

  // Mutation: Clock Out
  const clockOutMutation = useMutation({
    mutationFn: async ({ record_id, notes }: ClockOutPayload) => {
      const now = new Date().toISOString();
      const existing = attendanceRecords.find((r) => r.id === record_id);

      let totalMinutes = 0;
      if (existing?.clock_in_time) {
        const startMs = new Date(existing.clock_in_time).getTime();
        const endMs = new Date(now).getTime();
        totalMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));
      }

      if (!isOnline) {
        await recordOfflineClockOut(record_id, notes);
        return;
      }

      try {
        const { error } = await supabase
          .from("staff_attendance" as any)
          .update({
            clock_out_time: now,
            status: "completed",
            clock_out_notes: notes || null,
            total_minutes: totalMinutes,
            updated_at: now,
          })
          .eq("id", record_id);

        if (error) {
          console.warn("Remote clock-out failed, recording offline update:", error);
          await recordOfflineClockOut(record_id, notes);
          return;
        }

        await offlineDb.attendance.update(record_id, {
          clock_out_time: now,
          status: "completed",
          clock_out_notes: notes || null,
          total_minutes: totalMinutes,
          updated_at: now,
          synced: true,
        });
      } catch {
        await recordOfflineClockOut(record_id, notes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Clocked Out successfully. Shift recorded.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to clock out");
    },
  });

  // Mutation: Break Toggle (Start / End Break)
  const breakMutation = useMutation({
    mutationFn: async ({ record_id, action }: BreakActionPayload) => {
      const now = new Date().toISOString();
      const existing = attendanceRecords.find((r) => r.id === record_id);
      const isStart = action === "start";

      let breakMinutes = existing?.break_minutes || 0;
      if (!isStart && existing?.break_start_time) {
        const breakStart = new Date(existing.break_start_time).getTime();
        const breakEnd = new Date(now).getTime();
        breakMinutes += Math.max(0, Math.round((breakEnd - breakStart) / 60000));
      }

      const updateData: any = {
        status: isStart ? "on_break" : "on_duty",
        break_start_time: isStart ? now : null,
        break_minutes: breakMinutes,
        updated_at: now,
      };

      if (isOnline) {
        try {
          await supabase.from("staff_attendance" as any).update(updateData).eq("id", record_id);
        } catch (e) {
          console.warn("Failed remote break update, saving local:", e);
        }
      }

      await offlineDb.attendance.update(record_id, updateData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.info(variables.action === "start" ? "Break started." : "Break ended. Welcome back on duty!");
    },
  });

  // Mutation: Manager manual correction / audit note
  const manualUpdateMutation = useMutation({
    mutationFn: async ({
      id,
      clock_in_time,
      clock_out_time,
      status,
      clock_out_notes,
    }: {
      id: string;
      clock_in_time: string;
      clock_out_time?: string | null;
      status: "on_duty" | "on_break" | "completed";
      clock_out_notes?: string | null;
    }) => {
      let totalMinutes = 0;
      if (clock_in_time && clock_out_time) {
        const startMs = new Date(clock_in_time).getTime();
        const endMs = new Date(clock_out_time).getTime();
        totalMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));
      }

      const updatePayload: any = {
        clock_in_time,
        clock_out_time: clock_out_time || null,
        status,
        clock_out_notes: clock_out_notes || null,
        total_minutes: totalMinutes,
        updated_at: new Date().toISOString(),
      };

      if (isOnline) {
        try {
          await supabase.from("staff_attendance" as any).update(updatePayload).eq("id", id);
        } catch (err) {
          console.warn("Remote manual attendance update failed, updating local:", err);
        }
      }

      await offlineDb.attendance.update(id, updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance record updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update attendance record");
    },
  });

  return {
    attendanceRecords,
    activeUserSession,
    summary,
    isLoading,
    refetch,
    clockIn: clockInMutation.mutate,
    isClockingIn: clockInMutation.isPending,
    clockOut: clockOutMutation.mutate,
    isClockingOut: clockOutMutation.isPending,
    toggleBreak: breakMutation.mutate,
    isUpdatingBreak: breakMutation.isPending,
    manualUpdate: manualUpdateMutation.mutate,
    isManualUpdating: manualUpdateMutation.isPending,
  };
}
