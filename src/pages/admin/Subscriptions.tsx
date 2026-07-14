import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminType } from "@/hooks/useAdminType";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

interface SubscriptionRow {
  id: string;
  user_id: string;
  status: string;
  plan_type: string;
  trial_start_date: string;
  trial_end_date: string;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  business_name?: string;
  owner_email?: string;
}

export default function AdminSubscriptions() {
  const { t } = useLanguage();
  const { adminType, loading: adminLoading } = useAdminType();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [activateModal, setActivateModal] = useState<SubscriptionRow | null>(null);
  const [months, setMonths] = useState("1");

  const isSystemAdmin = adminType === "system_admin";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", page, debouncedSearch, statusFilter],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build query
      let query = supabase
        .from("subscriptions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      query = query.range(from, to);
      const { data: subs, error, count } = await query;
      if (error) throw error;

      if (!subs || subs.length === 0) {
        return { items: [] as SubscriptionRow[], totalCount: count ?? 0 };
      }

      // Batch enrich: get all user_ids, then fetch businesses and profiles in bulk
      const userIds = [...new Set(subs.map((s) => s.user_id))];

      const [bizRes, profileRes] = await Promise.all([
        supabase
          .from("businesses")
          .select("owner_id, business_name")
          .in("owner_id", userIds),
        supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds),
      ]);

      const bizMap = new Map<string, string>();
      (bizRes.data || []).forEach((b) => bizMap.set(b.owner_id, b.business_name));

      const emailMap = new Map<string, string>();
      (profileRes.data || []).forEach((p) => emailMap.set(p.user_id, p.email || "N/A"));

      let enriched: SubscriptionRow[] = subs.map((sub) => ({
        ...sub,
        business_name: bizMap.get(sub.user_id) || "N/A",
        owner_email: emailMap.get(sub.user_id) || "N/A",
      }));

      // Client-side search filter (on enriched fields)
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        enriched = enriched.filter(
          (s) =>
            s.business_name?.toLowerCase().includes(q) ||
            s.owner_email?.toLowerCase().includes(q)
        );
      }

      return { items: enriched, totalCount: count ?? 0 };
    },
    enabled: isSystemAdmin,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const activateMutation = useMutation({
    mutationFn: async ({ userId, monthsToAdd }: { userId: string; monthsToAdd: number }) => {
      const now = new Date();
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const startDate = now;
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + monthsToAdd);

      if (existing) {
        if (existing.status === "active" && existing.current_period_end && new Date(existing.current_period_end) > now) {
          const currentEnd = new Date(existing.current_period_end);
          currentEnd.setMonth(currentEnd.getMonth() + monthsToAdd);
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              plan_type: "premium",
              current_period_start: existing.current_period_end,
              current_period_end: currentEnd.toISOString(),
            })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              plan_type: "premium",
              current_period_start: startDate.toISOString(),
              current_period_end: endDate.toISOString(),
            })
            .eq("id", existing.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          user_id: userId,
          status: "active",
          plan_type: "premium",
          trial_start_date: startDate.toISOString(),
          trial_end_date: startDate.toISOString(),
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: t("admin.success"), description: t("adminSub.activated") });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      setActivateModal(null);
    },
    onError: (err: any) => {
      toast({ title: t("admin.error"), description: err.message, variant: "destructive" });
    },
  });

  if (adminLoading) return <div className="container mx-auto p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!isSystemAdmin) { navigate("/"); return null; }

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const getStatusBadge = (status: string, sub: SubscriptionRow) => {
    const now = new Date();
    if (status === "active" && sub.current_period_end && new Date(sub.current_period_end) > now) {
      return <Badge className="bg-green-500">{t("common.active")}</Badge>;
    }
    if (status === "free_trial" && new Date(sub.trial_end_date) > now) {
      return <Badge variant="secondary">{t("adminSub.trial")}</Badge>;
    }
    return <Badge variant="destructive">{t("adminSub.expired")}</Badge>;
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = items.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("adminSub.title")}</h1>
          <p className="text-muted-foreground">{t("adminSub.description")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("adminSub.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="active">{t("common.active")}</SelectItem>
                <SelectItem value="free_trial">{t("adminSub.trial")}</SelectItem>
                <SelectItem value="expired">{t("adminSub.expired")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminSub.business")}</TableHead>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("adminSub.planType")}</TableHead>
                    <TableHead>{t("adminSub.periodEnd")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t("adminSub.noSubscriptions")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.business_name}</TableCell>
                        <TableCell>{sub.owner_email}</TableCell>
                        <TableCell>{getStatusBadge(sub.status, sub)}</TableCell>
                        <TableCell className="capitalize">{sub.plan_type?.replace("_", " ")}</TableCell>
                        <TableCell>
                          {sub.current_period_end
                            ? format(new Date(sub.current_period_end), "MMM dd, yyyy")
                            : sub.status === "free_trial"
                            ? format(new Date(sub.trial_end_date), "MMM dd, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => setActivateModal(sub)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t("adminSub.activate")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {t("common.showing")} {startItem}-{endItem} {t("common.of")} {totalCount}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((p, i) =>
                        p === "ellipsis" ? (
                          <PaginationItem key={`e-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={page === p}
                              onClick={() => setPage(p)}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Activate/Extend Modal */}
      <Dialog open={!!activateModal} onOpenChange={() => setActivateModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminSub.activateTitle")}</DialogTitle>
            <DialogDescription>
              {t("adminSub.activateDesc")} <strong>{activateModal?.business_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("adminSub.duration")}</Label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6, 12].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} {m === 1 ? t("subscription.month") : t("subscription.months")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p>{t("subscription.total")}: <strong>${Number(months) * 2}</strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateModal(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                activateModal && activateMutation.mutate({ userId: activateModal.user_id, monthsToAdd: Number(months) })
              }
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? t("common.loading") : t("adminSub.confirmActivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
