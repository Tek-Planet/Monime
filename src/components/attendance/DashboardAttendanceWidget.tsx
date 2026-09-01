import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, UserCheck, Coffee, ArrowRight } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useNavigate } from 'react-router-dom';

interface DashboardAttendanceWidgetProps {
  businessId?: string;
}

export function DashboardAttendanceWidget({ businessId }: DashboardAttendanceWidgetProps) {
  const { summary, activeUserSession, isLoading } = useAttendance(businessId);
  const navigate = useNavigate();

  if (isLoading) return null;

  return (
    <Card className="border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-foreground">Attendance & Floor Sessions</h4>
              {activeUserSession ? (
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                  {activeUserSession.status === 'on_break' ? '🟡 You: On Break' : '🟢 You: Clocked In'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  You: Not Clocked In
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              <strong>{summary.active_now}</strong> staff currently on duty • <strong>{summary.total_hours_today}</strong> hours logged today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/attendance')}
            className="h-8 text-xs gap-1.5"
          >
            <span>{activeUserSession ? 'Manage Shift' : 'Punch In / Roster'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
