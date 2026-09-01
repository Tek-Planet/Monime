import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, LogIn, LogOut, Coffee, ShieldCheck, UserCheck, AlertCircle, Building2 } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext } from '@/contexts/BranchContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

export function ClockInOutCard() {
  const { profile, business } = useUserProfile();
  const { user } = useAuth();
  const { selectedBranchId, allBranches, accessibleBranches } = useBranchContext();
  const { t } = useLanguage();

  const businessId = business?.id;
  const {
    activeUserSession,
    clockIn,
    isClockingIn,
    clockOut,
    isClockingOut,
    toggleBreak,
    isUpdatingBreak,
  } = useAttendance(businessId);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isClockOutDialogOpen, setIsClockOutDialogOpen] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState('');
  const [clockInNotes, setClockInNotes] = useState('');

  // Live timer for current clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live elapsed time for active session
  useEffect(() => {
    if (!activeUserSession?.clock_in_time) {
      setElapsedMinutes(0);
      return;
    }

    const updateElapsed = () => {
      const startMs = new Date(activeUserSession.clock_in_time).getTime();
      const nowMs = new Date().getTime();
      const diffMins = Math.max(0, Math.floor((nowMs - startMs) / 60000));
      setElapsedMinutes(diffMins);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 30000);
    return () => clearInterval(interval);
  }, [activeUserSession]);

  const formatElapsedTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m}m`;
    return `${hours}h ${m}m`;
  };

  const handleClockIn = () => {
    if (!businessId || !user) return;

    const staffName =
      profile?.first_name || profile?.last_name
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : user.email?.split('@')[0] || 'Staff Member';

    clockIn({
      business_id: businessId,
      branch_id: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : null,
      user_id: user.id,
      staff_name: staffName,
      staff_email: user.email,
      staff_role: 'staff',
      notes: clockInNotes,
    });
    setClockInNotes('');
  };

  const handleConfirmClockOut = () => {
    if (!activeUserSession) return;
    clockOut({
      record_id: activeUserSession.id,
      notes: clockOutNotes,
    });
    setIsClockOutDialogOpen(false);
    setClockOutNotes('');
  };

  const branchList = allBranches || accessibleBranches || [];
  const currentBranchName =
    branchList.find((b) => b?.id === (activeUserSession?.branch_id || selectedBranchId))?.name ||
    'Main Office';

  return (
    <>
      <Card className="border border-border/80 shadow-sm overflow-hidden bg-card">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-semibold">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-none text-foreground">Attendance Punch Clock</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Track your shifts and working sessions</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold tracking-tight font-mono">
              {format(currentTime, 'hh:mm:ss a')}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(currentTime, 'EEEE, MMM d, yyyy')}
            </div>
          </div>
        </div>

        <CardContent className="p-5">
          {activeUserSession ? (
            // User is currently clocked in
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <Badge variant={activeUserSession.status === 'on_break' ? 'secondary' : 'default'} className="text-xs font-medium">
                      {activeUserSession.status === 'on_break' ? '🟡 On Break' : '🟢 Active On Duty'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Started at {format(new Date(activeUserSession.clock_in_time), 'hh:mm a')}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Station: <strong>{currentBranchName}</strong></span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Duration</div>
                  <div className="text-2xl font-bold text-foreground font-mono">
                    {formatElapsedTime(elapsedMinutes)}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() =>
                    toggleBreak({
                      record_id: activeUserSession.id,
                      action: activeUserSession.status === 'on_break' ? 'end' : 'start',
                    })
                  }
                  disabled={isUpdatingBreak}
                  className="flex items-center justify-center gap-2 border-border/80"
                >
                  <Coffee className="h-4 w-4 text-amber-500" />
                  <span>
                    {activeUserSession.status === 'on_break' ? 'Resume Shift' : 'Take a Break'}
                  </span>
                </Button>

                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => setIsClockOutDialogOpen(true)}
                  disabled={isClockingOut}
                  className="flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Clock Out Session</span>
                </Button>
              </div>
            </div>
          ) : (
            // User is not clocked in
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-dashed border-border text-sm text-muted-foreground">
                <UserCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Ready to start your work session?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your clock-in timestamp and branch location will be recorded for payroll and business transparency.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  className="w-full sm:w-auto flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm gap-2"
                  onClick={handleClockIn}
                  disabled={isClockingIn}
                >
                  <LogIn className="h-4 w-4" />
                  <span>{isClockingIn ? 'Clocking in...' : 'Clock In Now'}</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clock Out Modal */}
      <Dialog open={isClockOutDialogOpen} onOpenChange={setIsClockOutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              <span>Confirm Clock Out</span>
            </DialogTitle>
            <DialogDescription>
              You have completed <strong>{formatElapsedTime(elapsedMinutes)}</strong> in this shift.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground">
              Shift Notes / Handover Comments (Optional)
            </label>
            <Textarea
              placeholder="e.g. Register balance balanced, keys handed over to John..."
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsClockOutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClockOut} disabled={isClockingOut}>
              {isClockingOut ? 'Clocking out...' : 'Confirm Clock Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
