import { useState } from "react";
import { X, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationPromptBannerProps {
  businessName?: string;
}

export function LocationPromptBanner({ businessName }: LocationPromptBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("location-banner-dismissed") === "true";
  });
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleDismiss = () => {
    localStorage.setItem("location-banner-dismissed", "true");
    setDismissed(true);
  };

  const handleAddLocation = () => {
    navigate("/settings?tab=business&section=location");
  };

  if (dismissed) return null;

  return (
    <Alert className="mb-6 border-warning/50 bg-warning/10">
      <MapPin className="h-4 w-4 text-warning" />
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
        <div className="flex-1">
          <span className="font-medium text-foreground">
            {t("location.addLocationPrompt")}
          </span>
          <span className="text-muted-foreground ml-1">
            {t("location.addLocationDescription")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddLocation}
          >
            <Navigation className="h-4 w-4 mr-2" />
            {t("location.addLocation")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
