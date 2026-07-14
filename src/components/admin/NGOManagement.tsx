import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NGOAdminManagement } from "./NGOAdminManagement";
import { EditNGOModal } from "./EditNGOModal";
import { NGOBusinessesModal } from "./NGOBusinessesModal";
import { AssignBusinessModal } from "./AssignBusinessModal";
import { ExportButton } from "./ExportButton";
import { useAdminNGOs, useCreateNGO } from "@/hooks/admin/useAdminNGOs";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useLanguage } from "@/contexts/LanguageContext";

const ITEMS_PER_PAGE = 10;

export function NGOManagement() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    address: ""
  });
  const { data: ngos = [], isLoading } = useAdminNGOs();
  const createNGOMutation = useCreateNGO();
  const totalPages = Math.ceil(ngos.length / ITEMS_PER_PAGE);
  const paginatedNGOs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return ngos.slice(start, start + ITEMS_PER_PAGE);
  }, [ngos, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createNGOMutation.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ name: "", description: "", contact_email: "", contact_phone: "", address: "" });
      }
    });
  };

  const exportData = ngos.map(ngo => ({
    name: ngo.name,
    description: ngo.description || "-",
    contact_email: ngo.contact_email || "-",
    contact_phone: ngo.contact_phone || "-",
    status: ngo.is_active ? t("common.active") : t("common.inactive"),
    created_at: new Date(ngo.created_at).toLocaleDateString()
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center items-start justify-between">
          <div>
            <CardTitle>{t("admin.ngoMgmtTitle")}</CardTitle>
            <CardDescription>{t("admin.manageNgosAndBusinesses")}</CardDescription>
          </div>
          <div className="flex w-full flex-col md:flex-row gap-2">
            <ExportButton data={exportData} filename="ngos" headers={[t("common.name"), t("common.description"), t("admin.contactEmail"), t("admin.contactPhone"), t("common.status"), t("admin.created")]} />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin.addNgo")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
                <DialogHeader className="flex-shrink">
                  <DialogTitle>{t("admin.createNewNgo")}</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 grid gap-4 sm:gap-6 py-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">{t("common.name")} *</Label>
                      <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="description">{t("common.description")}</Label>
                      <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">{t("admin.contactEmail")}</Label>
                      <Input id="contact_email" type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">{t("admin.contactPhone")}</Label>
                      <Input id="contact_phone" value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="address">{t("common.address")}</Label>
                      <Textarea id="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full" disabled={createNGOMutation.isPending}>
                      {createNGOMutation.isPending ? t("admin.creating") : t("admin.createNgoBtn")}
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : ngos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("admin.noNgosRegistered")}</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {paginatedNGOs.map(ngo => (
                  <div key={ngo.id} className="border border-border rounded-lg p-4 bg-card cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/ngos/${ngo.id}`)}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-primary">{ngo.name}</div>
                        {ngo.description && <div className="text-sm text-muted-foreground">{ngo.description}</div>}
                      </div>
                      <Badge variant={ngo.is_active ? "default" : "secondary"}>
                        {ngo.is_active ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {ngo.contact_email && <div>{ngo.contact_email}</div>}
                      {ngo.contact_phone && <div>{ngo.contact_phone}</div>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("admin.created")}: {new Date(ngo.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("admin.contact")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("admin.created")}</TableHead>
                      <TableHead>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedNGOs.map(ngo => (
                      <TableRow key={ngo.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/ngos/${ngo.id}`)}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-primary hover:underline">{ngo.name}</div>
                            {ngo.description && <div className="text-sm text-muted-foreground">{ngo.description}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {ngo.contact_email && <div>{ngo.contact_email}</div>}
                            {ngo.contact_phone && <div>{ngo.contact_phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ngo.is_active ? "default" : "secondary"}>
                            {ngo.is_active ? t("common.active") : t("common.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(ngo.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="default" size="sm" onClick={e => { e.stopPropagation(); navigate(`/admin/ngos/${ngo.id}`); }}>
                            {t("admin.viewDetails")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t("admin.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} {t("common.to")}{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, ngos.length)} {t("admin.of")} {ngos.length} NGOs
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                      <div className="hidden md:flex">
                        {getPageNumbers().map((page, index) =>
                          page === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem>
                          ) : (
                            <PaginationItem key={page}>
                              <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                            </PaginationItem>
                          )
                        )}
                      </div>
                      <PaginationItem className="md:hidden">
                        <span className="text-sm">{currentPage} {t("admin.of")} {totalPages}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
