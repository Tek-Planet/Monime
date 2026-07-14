import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Pencil } from "lucide-react";
import { ExportButton } from "./ExportButton";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { useAdminUsers, AdminUser } from "@/hooks/admin/useAdminUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ITEMS_PER_PAGE = 10;

export function UserManagement() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const { data: users = [], isLoading } = useAdminUsers();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = `${user.first_name || ""} ${user.last_name || ""}`.trim().toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || user.email.toLowerCase().includes(search);
      const matchesRole = roleFilter === "all" || (roleFilter === "admin" && user.is_admin) || (roleFilter === "user" && !user.is_admin);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1); if (currentPage > 2) pages.push("ellipsis"); if (currentPage !== 1 && currentPage !== totalPages) pages.push(currentPage); if (currentPage < totalPages - 1) pages.push("ellipsis"); pages.push(totalPages); }
    return pages;
  };

  const exportData = filteredUsers.map((user) => ({
    name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || t("admin.noName"),
    email: user.email,
    role: user.is_admin ? t("admin.admin") : t("admin.user"),
    joined: new Date(user.created_at).toLocaleDateString(),
  }));

  const getUserName = (user: AdminUser) => user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : t("admin.noName");

  return (
    <>
      <EditUserModal open={showEditModal} onOpenChange={setShowEditModal} user={selectedUser} />
      <DeleteUserDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} user={selectedUser} />
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row items-start md:items-center justify-between mb-2">
            <div>
              <CardTitle>{t("admin.userMgmtTitle")}</CardTitle>
              <CardDescription>{t("admin.manageUserRoles")}</CardDescription>
            </div>
            <ExportButton data={exportData} filename="users" headers={[t("admin.name"), t("admin.email"), t("admin.role"), t("admin.joined")]} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("admin.searchUsersPlaceholder")} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as any); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={t("admin.filterByRole")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allRoles")}</SelectItem>
                <SelectItem value="admin">{t("admin.admin")}</SelectItem>
                <SelectItem value="user">{t("admin.user")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {paginatedUsers.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">{t("admin.noUsersFound")}</div>
                ) : paginatedUsers.map((user) => (
                  <div key={user.id} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{getUserName(user)}</div>
                      <Badge variant={user.is_admin ? "default" : "secondary"}>{user.is_admin ? t("admin.admin") : t("admin.user")}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">{user.email}</div>
                    <div className="text-xs text-muted-foreground mb-3">{t("admin.joined")}: {new Date(user.created_at).toLocaleDateString()}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => { setSelectedUser(user); setShowEditModal(true); }} className="flex-1"><Pencil className="h-4 w-4 mr-2" />{t("admin.edit")}</Button>
                      <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(user); setShowDeleteDialog(true); }} className="flex-1"><Trash2 className="h-4 w-4 mr-2" />{t("common.delete")}</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.email")}</TableHead><TableHead>{t("admin.role")}</TableHead><TableHead>{t("admin.joined")}</TableHead><TableHead>{t("admin.actions")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("admin.noUsersFound")}</TableCell></TableRow>
                    ) : paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell><div className="font-medium">{getUserName(user)}</div></TableCell>
                        <TableCell><div className="text-sm text-muted-foreground">{user.email}</div></TableCell>
                        <TableCell><Badge variant={user.is_admin ? "default" : "secondary"}>{user.is_admin ? t("admin.admin") : t("admin.user")}</Badge></TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" onClick={() => { setSelectedUser(user); setShowEditModal(true); }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(user); setShowDeleteDialog(true); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">{t("admin.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} {t("admin.of")} {filteredUsers.length} {t("admin.users")}</p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem><PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                      <div className="hidden md:flex">
                        {getPageNumbers().map((page, index) => page === "ellipsis" ? <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem> : <PaginationItem key={page}><PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>)}
                      </div>
                      <PaginationItem className="md:hidden"><span className="text-sm">{currentPage} {t("admin.of")} {totalPages}</span></PaginationItem>
                      <PaginationItem><PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}