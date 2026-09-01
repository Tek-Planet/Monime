import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/contexts/AuthContext';
import { ClockInOutCard } from '@/components/attendance/ClockInOutCard';
import { LiveStaffRoster } from '@/components/attendance/LiveStaffRoster';
import { AttendanceHistoryTable } from '@/components/attendance/AttendanceHistoryTable';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Users, Clock, Coffee, CheckCircle2, TrendingUp, Sparkles, UserCheck } from 'lucide-react';
import type { AttendanceRecord } from '@/types/attendance';
import { format } from 'date-fns';

export default function AttendancePage() {
  const { business } = useUserProfile();
  const { user } = useAuth();
  const businessId = business?.id;

  const {
    attendanceRecords,
    activeUserSession,
    summary,
    isLoading,
    manualUpdate,
    isManualUpdating,
  } = useAttendance(businessId);

  const [activeTab, setActiveTab] = useState('overview');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editClockInTime, setEditClockInTime] = useState('');
  const [editClockOutTime, setEditClockOutTime] = useState('');
  const [editStatus, setEditStatus] = useState<'on_duty' | 'on_break' | 'completed'>('completed');
  const [editNotes, setEditNotes] = useState('');

  // Personal records for the currently logged in user
  const myRecords = attendanceRecords.filter((r) => r.user_id === user?.id);

  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditClockInTime(
      record.clock_in_time ? format(new Date(record.clock_in_time), "yyyy-MM-dd'T'HH:mm") : ''
    );
    setEditClockOutTime(
      record.clock_out_time ? format(new Date(record.clock_out_time), "yyyy-MM-dd'T'HH:mm") : ''
    );
    setEditStatus(record.status);
    setEditNotes(record.clock_out_notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    manualUpdate({
      id: editingRecord.id,
      clock_in_time: new Date(editClockInTime).toISOString(),
      clock_out_time: editClockOutTime ? new Date(editClockOutTime).toISOString() : null,
      status: editStatus,
      clock_out_notes: editNotes,
    });
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <span>Staff Attendance & Shift Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor working sessions, track team clock-ins, and manage timesheets for your business.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active On Duty</p>
              <h4 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {summary.active_now}
              </h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">On Break</p>
              <h4 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {summary.on_break}
              </h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Coffee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Hours Logged Today</p>
              <h4 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {summary.total_hours_today} <span className="text-xs font-normal text-muted-foreground">hrs</span>
              </h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Avg Shift Length</p>
              <h4 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {summary.average_shift_hours} <span className="text-xs font-normal text-muted-foreground">hrs</span>
              </h4>
            </div>
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clock In / Out Personal Punch Station */}
      <ClockInOutCard />

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Live Floor & Roster
          </TabsTrigger>
          <TabsTrigger value="timesheets" className="text-xs sm:text-sm">
            All Timesheets & History
          </TabsTrigger>
          <TabsTrigger value="my-log" className="text-xs sm:text-sm">
            My Attendance Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <LiveStaffRoster records={attendanceRecords} isLoading={isLoading} />
          <AttendanceHistoryTable
            records={attendanceRecords.slice(0, 10)}
            isLoading={isLoading}
            onEditRecord={openEditModal}
          />
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-4">
          <AttendanceHistoryTable
            records={attendanceRecords}
            isLoading={isLoading}
            onEditRecord={openEditModal}
          />
        </TabsContent>

        <TabsContent value="my-log" className="space-y-4">
          <AttendanceHistoryTable
            records={myRecords}
            isLoading={isLoading}
            onEditRecord={openEditModal}
          />
        </TabsContent>
      </Tabs>

      {/* Manager Edit Modal */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Adjust timestamps or audit details for <strong>{editingRecord?.staff_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-medium text-foreground">Clock In Time</label>
              <Input
                type="datetime-local"
                value={editClockInTime}
                onChange={(e) => setEditClockInTime(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Clock Out Time</label>
              <Input
                type="datetime-local"
                value={editClockOutTime}
                onChange={(e) => setEditClockOutTime(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Session Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="on_duty">On Duty</option>
                <option value="on_break">On Break</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Notes / Reason for Adjustment</label>
              <Textarea
                placeholder="e.g. Employee forgot to punch out at end of shift..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="text-xs mt-1 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingRecord(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={isManualUpdating}>
              {isManualUpdating ? 'Saving...' : 'Save Adjustments'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
