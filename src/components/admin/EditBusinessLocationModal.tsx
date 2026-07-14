import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface EditBusinessLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
}

export function EditBusinessLocationModal({ open, onOpenChange, businessId, businessName, currentLatitude, currentLongitude }: EditBusinessLocationModalProps) {
  const { t } = useLanguage();
  const [latitude, setLatitude] = useState<number | null>(currentLatitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(currentLongitude ?? null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("businesses").update({ latitude, longitude }).eq("id", businessId);
      if (error) throw error;
      toast.success(t("admin.locationUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin-business", businessId] });
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(t("admin.failedToUpdateLocation") + ": " + error.message);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t("admin.editLocation")} - {businessName}</DialogTitle></DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">{t("admin.clickMapOrUseLocation")}</p>
          <LocationPicker latitude={latitude} longitude={longitude} onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} height="300px" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{t("admin.saveLocation")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}