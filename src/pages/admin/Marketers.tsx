import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminType } from "@/hooks/useAdminType";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Plus, Users, DollarSign, Copy } from "lucide-react";
import { format } from "date-fns";

export default function AdminMarketers() {
  const { t } = useLanguage();
  const { adminType, loading: adminLoading } = useAdminType();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [commissionModal, setCommissionModal] = useState<any>(null);
  const [assignModal, setAssignModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [commAmount, setCommAmount] = useState("");
  const [commNotes, setCommNotes] = useState("");
  const [assignBusinessId, setAssignBusinessId] = useState("");
  const [assignMarketerId, setAssignMarketerId] = useState("");

  const isSystemAdmin = adminType === "system_admin";

  const { data: marketers, isLoading } = useQuery({
    queryKey: ["admin-marketers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isSystemAdmin,
  });

  const { data: referrals } = useQuery({
    queryKey: ["admin-marketer-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketer_referrals")
        .select("*, marketers(name, referral_code), businesses(business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isSystemAdmin,
  });

  const { data: businesses } = useQuery({
    queryKey: ["admin-all-businesses-for-assign"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("id, business_name").order("business_name");
      if (error) throw error;
      return data;
    },
    enabled: isSystemAdmin,
  });

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MKT-";
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const addMarketerMutation = useMutation({
    mutationFn: async () => {
      const code = generateCode();
      const { error } = await supabase.from("marketers").insert({
        name, email: email || null, phone: phone || null, notes: notes || null,
        referral_code: code,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.success"), description: t("marketer.created") });
      queryClient.invalidateQueries({ queryKey: ["admin-marketers"] });
      setAddModal(false);
      setName(""); setEmail(""); setPhone(""); setNotes("");
    },
    onError: (err: any) => {
      toast({ title: t("admin.error"), description: err.message, variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      // Also update business referred_by_marketer_id
      const { error: refError } = await supabase.from("marketer_referrals").insert({
        marketer_id: assignMarketerId,
        business_id: assignBusinessId,
      });
      if (refError) throw refError;
      const { error: bizError } = await supabase
        .from("businesses")
        .update({ referred_by_marketer_id: assignMarketerId })
        .eq("id", assignBusinessId);
      if (bizError) throw bizError;
    },
    onSuccess: () => {
      toast({ title: t("admin.success"), description: t("marketer.assigned") });
      queryClient.invalidateQueries({ queryKey: ["admin-marketer-referrals"] });
      setAssignModal(false);
      setAssignBusinessId(""); setAssignMarketerId("");
    },
    onError: (err: any) => {
      toast({ title: t("admin.error"), description: err.message, variant: "destructive" });
    },
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes: string }) => {
      const { error } = await supabase
        .from("marketer_referrals")
        .update({ commission_amount: amount, notes, commission_status: "set" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.success"), description: t("marketer.commissionUpdated") });
      queryClient.invalidateQueries({ queryKey: ["admin-marketer-referrals"] });
      setCommissionModal(null);
    },
    onError: (err: any) => {
      toast({ title: t("admin.error"), description: err.message, variant: "destructive" });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketer_referrals")
        .update({ commission_status: "paid", commission_paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("admin.success"), description: t("marketer.markedPaid") });
      queryClient.invalidateQueries({ queryKey: ["admin-marketer-referrals"] });
    },
  });

  if (adminLoading) return <div className="container mx-auto p-6"><Skeleton className="h-96 w-full" /></div>;
  if (!isSystemAdmin) { navigate("/"); return null; }

  const filteredMarketers = (marketers || []).filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.referral_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t("marketer.title")}</h1>
          <p className="text-muted-foreground">{t("marketer.description")}</p>
        </div>
        <Button onClick={() => setAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t("marketer.addMarketer")}
        </Button>
      </div>

      <Tabs defaultValue="marketers">
        <TabsList>
          <TabsTrigger value="marketers">
            <Users className="h-4 w-4 mr-2" /> {t("marketer.marketers")}
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <DollarSign className="h-4 w-4 mr-2" /> {t("marketer.referrals")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketers">
          <Card>
            <CardHeader>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("marketer.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button variant="outline" onClick={() => setAssignModal(true)}>
                  {t("marketer.assignBusiness")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("common.phone")}</TableHead>
                    <TableHead>{t("marketer.referralCode")}</TableHead>
                    <TableHead>{t("marketer.referralCount")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMarketers.map((m) => {
                    const refCount = (referrals || []).filter((r: any) => r.marketer_id === m.id).length;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>{m.email || "—"}</TableCell>
                        <TableCell>{m.phone || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm">{m.referral_code}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(m.referral_code);
                                toast({ title: t("admin.codeCopied") });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{refCount}</TableCell>
                        <TableCell>
                          <Badge variant={m.is_active ? "default" : "secondary"}>
                            {m.is_active ? t("common.active") : t("common.inactive")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredMarketers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t("marketer.noMarketers")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("marketer.marketerName")}</TableHead>
                    <TableHead>{t("adminSub.business")}</TableHead>
                    <TableHead>{t("marketer.commission")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(referrals || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.marketers?.name}</TableCell>
                      <TableCell>{r.businesses?.business_name}</TableCell>
                      <TableCell>${r.commission_amount || 0}</TableCell>
                      <TableCell>
                        <Badge variant={r.commission_status === "paid" ? "default" : "secondary"}>
                          {r.commission_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(r.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setCommissionModal(r); setCommAmount(String(r.commission_amount || "")); setCommNotes(r.notes || ""); }}>
                          {t("marketer.setCommission")}
                        </Button>
                        {r.commission_status !== "paid" && r.commission_amount > 0 && (
                          <Button size="sm" variant="default" onClick={() => markPaidMutation.mutate(r.id)}>
                            {t("marketer.markPaid")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!referrals || referrals.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t("marketer.noReferrals")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Marketer Modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("marketer.addMarketer")}</DialogTitle>
            <DialogDescription>{t("marketer.addDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("common.name")} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("marketer.namePlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.email")}</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-2">
                <Label>{t("common.phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("common.notes")}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(false)}>{t("common.cancel")}</Button>
            <Button onClick={() => addMarketerMutation.mutate()} disabled={!name || addMarketerMutation.isPending}>
              {addMarketerMutation.isPending ? t("common.loading") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Business Modal */}
      <Dialog open={assignModal} onOpenChange={setAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("marketer.assignBusiness")}</DialogTitle>
            <DialogDescription>{t("marketer.assignDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("marketer.selectMarketer")} *</Label>
              <select className="w-full border rounded-md p-2" value={assignMarketerId} onChange={(e) => setAssignMarketerId(e.target.value)}>
                <option value="">{t("common.select")}</option>
                {(marketers || []).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.referral_code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("marketer.selectBusiness")} *</Label>
              <select className="w-full border rounded-md p-2" value={assignBusinessId} onChange={(e) => setAssignBusinessId(e.target.value)}>
                <option value="">{t("common.select")}</option>
                {(businesses || []).map((b) => (
                  <option key={b.id} value={b.id}>{b.business_name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModal(false)}>{t("common.cancel")}</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={!assignMarketerId || !assignBusinessId || assignMutation.isPending}>
              {assignMutation.isPending ? t("common.loading") : t("marketer.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Commission Modal */}
      <Dialog open={!!commissionModal} onOpenChange={() => setCommissionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("marketer.setCommission")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("marketer.commissionAmount")} ($)</Label>
              <Input type="number" value={commAmount} onChange={(e) => setCommAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.notes")}</Label>
              <Textarea value={commNotes} onChange={(e) => setCommNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionModal(null)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => commissionModal && updateCommissionMutation.mutate({ id: commissionModal.id, amount: Number(commAmount), notes: commNotes })}
              disabled={updateCommissionMutation.isPending}
            >
              {updateCommissionMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
