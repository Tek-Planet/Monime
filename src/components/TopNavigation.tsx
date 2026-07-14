import { Bell, User, LogOut, Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { BranchSelector } from "@/components/BranchSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";

export function TopNavigation() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { business, loading, profile, profilePhotoUrl } = useUserProfile();
  const navigate = useNavigate();

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 min-h-12 sm:min-h-14 pt-[calc(env(safe-area-inset-top)+0.25rem)] pb-1 border-b bg-card/80 backdrop-blur-md flex items-center px-2 sm:px-4">
      {/* Left: Menu trigger + business name */}
      <div className="flex items-center gap-1.5 min-w-0">
        <SidebarTrigger className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground transition-colors" />
        <span className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-[180px] hidden sm:inline">
          {loading ? t("business.defaultname") : business?.business_name || t("business.defaultname")}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: actions — uniform icon sizing */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <BranchSelector />
        <LanguageSwitch />

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          onClick={() => navigate("/settings")}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-destructive rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Avatar className="h-7 w-7">
                {profilePhotoUrl && (
                  <AvatarImage src={profilePhotoUrl} alt="Profile" />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background z-50">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{t("common.profile")}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User className="mr-2 h-4 w-4" />
              {t("common.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              {t("nav.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("common.signout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
