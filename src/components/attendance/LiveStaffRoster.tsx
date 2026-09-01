import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Clock, Coffee, ShieldCheck, MapPin } from 'lucide-react';
import type { AttendanceRecord } from '@/types/attendance';
import { format } from 'date-fns';

interface LiveStaffRosterProps {
  records: AttendanceRecord[];
  isLoading: boolean;
}

export function LiveStaffRoster({ records, isLoading }: LiveStaffRosterProps) {
  const activeMembers = records.filter(
    (r) => (r.status === 'on_duty' || r.status === 'on_break') && !r.clock_out_time
  );

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getShiftDuration = (clockInTime: string) => {
    const start = new Date(clockInTime).getTime();
    const now = new Date().getTime();
    const mins = Math.max(0, Math.floor((now - start) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <Card className="border border-border/80 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">On-Duty Staff Roster</CardTitle>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {activeMembers.length} Active Now
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Real-time view of all staff members currently clocked in across branches
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading active staff on duty...
          </div>
        ) : activeMembers.length === 0 ? (
          <div className="py-8 text-center border rounded-lg border-dashed bg-muted/20">
            <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-foreground">No staff currently clocked in</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Staff members will appear here immediately once they punch into their shift.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeMembers.map((member) => {
              const isOnBreak = member.status === 'on_break';
              return (
                <div
                  key={member.id}
                  className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border/60">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {getInitials(member.staff_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate max-w-[140px]">
                          {member.staff_name}
                        </p>
                        {member.is_offline && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1 py-0.2 rounded">
                            offline
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {member.staff_email || 'Staff'}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground/70" />
                        <span className="truncate">{member.branch?.name || 'Main Branch'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <Badge
                      variant={isOnBreak ? 'secondary' : 'default'}
                      className={`text-[10px] px-1.5 py-0.5 font-normal ${
                        isOnBreak
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isOnBreak ? 'On Break' : 'On Duty'}
                    </Badge>
                    <div className="text-xs font-mono text-foreground font-medium mt-1">
                      {getShiftDuration(member.clock_in_time)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      since {format(new Date(member.clock_in_time), 'hh:mm a')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
