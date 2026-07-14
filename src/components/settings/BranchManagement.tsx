import { useState } from "react";
import { Plus, Edit, Trash2, Building2, MapPin, Phone, Mail, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBranches, Branch, CreateBranchInput, UpdateBranchInput } from "@/hooks/useBranches";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

interface BranchFormData {
  branch_name: string;
  branch_code: string;
  address: string;
  phone: string;
  email: string;
  is_headquarters: boolean;
}

const emptyForm: BranchFormData = {
  branch_name: "",
  branch_code: "",
  address: "",
  phone: "",
  email: "",
  is_headquarters: false,
};

export function BranchManagement() {
  const { t } = useLanguage();
  const { business } = useUserProfile();
  const { branches, loading, createBranch, updateBranch, deleteBranch, isCreating, isUpdating, isDeleting } =
    useBranches(business?.id);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(emptyForm);

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setShowAddDialog(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      branch_name: branch.branch_name,
      branch_code: branch.branch_code || "",
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      is_headquarters: branch.is_headquarters,
    });
    setShowEditDialog(true);
  };

  const handleOpenDelete = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowDeleteDialog(true);
  };

  const handleCreate = async () => {
    if (!business?.id || !formData.branch_name.trim()) return;

    const input: CreateBranchInput = {
      business_id: business.id,
      branch_name: formData.branch_name.trim(),
      branch_code: formData.branch_code.trim() || undefined,
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      is_headquarters: formData.is_headquarters,
    };

    await createBranch(input);
    setShowAddDialog(false);
    setFormData(emptyForm);
  };

  const handleUpdate = async () => {
    if (!selectedBranch || !formData.branch_name.trim()) return;

    const updates: UpdateBranchInput = {
      branch_name: formData.branch_name.trim(),
      branch_code: formData.branch_code.trim() || undefined,
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      is_headquarters: formData.is_headquarters,
    };

    await updateBranch({ branchId: selectedBranch.id, updates });
    setShowEditDialog(false);
    setSelectedBranch(null);
    setFormData(emptyForm);
  };

  const handleDelete = async () => {
    if (!selectedBranch) return;

    await deleteBranch(selectedBranch.id);
    setShowDeleteDialog(false);
    setSelectedBranch(null);
  };

  if (loading) {
    return (
      <Card className="professional-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="professional-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-5 w-5" />
            {t("branches.management")}
          </CardTitle>
          <Button onClick={handleOpenAdd} size="sm" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t("branches.addBranch")}
          </Button>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">{t("branches.noBranches")}</p>
              <p className="text-sm">{t("branches.noBranchesDescription")}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{branch.branch_name}</h4>
                      {branch.is_headquarters && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          HQ
                        </Badge>
                      )}
                      {branch.branch_code && (
                        <Badge variant="outline">{branch.branch_code}</Badge>
                      )}
                      {!branch.is_active && (
                        <Badge variant="destructive">{t("common.inactive")}</Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
                      {branch.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{branch.address}</span>
                        </span>
                      )}
                      {branch.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          {branch.phone}
                        </span>
                      )}
                      {branch.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{branch.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(branch)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDelete(branch)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Branch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="w-[95vw] max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t("branches.addBranch")}</DialogTitle>
            <DialogDescription>{t("branches.addBranchDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="branch_name">{t("branches.branchName")} *</Label>
                <Input
                  id="branch_name"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder={t("branches.branchNamePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="branch_code">{t("branches.branchCode")}</Label>
                <Input
                  id="branch_code"
                  value={formData.branch_code}
                  onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., LKI"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t("common.phonePlaceholder")}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">{t("common.address")}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t("common.addressPlaceholder")}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t("common.emailPlaceholder")}
                />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <Label htmlFor="is_headquarters" className="cursor-pointer">
                  {t("branches.isHeadquarters")}
                </Label>
                <Switch
                  id="is_headquarters"
                  checked={formData.is_headquarters}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_headquarters: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !formData.branch_name.trim()}>
              {isCreating ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="w-[95vw] max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t("branches.editBranch")}</DialogTitle>
            <DialogDescription>{t("branches.editBranchDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit_branch_name">{t("branches.branchName")} *</Label>
                <Input
                  id="edit_branch_name"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder={t("branches.branchNamePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="edit_branch_code">{t("branches.branchCode")}</Label>
                <Input
                  id="edit_branch_code"
                  value={formData.branch_code}
                  onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., LKI"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="edit_phone">{t("common.phone")}</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t("common.phonePlaceholder")}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_address">{t("common.address")}</Label>
                <Input
                  id="edit_address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t("common.addressPlaceholder")}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_email">{t("common.email")}</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t("common.emailPlaceholder")}
                />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <Label htmlFor="edit_is_headquarters" className="cursor-pointer">
                  {t("branches.isHeadquarters")}
                </Label>
                <Switch
                  id="edit_is_headquarters"
                  checked={formData.is_headquarters}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_headquarters: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || !formData.branch_name.trim()}>
              {isUpdating ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("branches.deleteBranch")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("branches.deleteConfirmation").replace("{name}", selectedBranch?.branch_name || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
