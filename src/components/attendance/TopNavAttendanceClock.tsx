import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";

export function TopNavAttendanceClock() {
  const { business } = useUserProfile();
  const { activeUserSession } = useAttendance(business?.id);
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
      onClick={() => navigate("/attendance")}
      title={activeUserSession ? "You are currently on shift" : "Open Attendance Clock"}
    >
      <Clock className={`h-3.5 w-3.5 ${activeUserSession ? "text-emerald-500 animate-pulse" : ""}`} />
      {activeUserSession ? (
        <Badge
          variant="outline"
          className="h-5 px-1.5 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-medium hidden sm:inline-flex"
        >
          {activeUserSession.status === "on_break" ? "Break" : "On Duty"}
        </Badge>
      ) : (
        <span className="hidden md:inline text-xs font-medium">Clock In</span>
      )}
    </Button>
  );
}
