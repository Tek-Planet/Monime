import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Calendar,
  Edit,
  Plus,
  Wallet,
  Gift,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, isSameDay, parseISO } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  business_type?: string;
  credit_limit: number;
  current_balance: number;
  birthday?: string;
  created_at: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  description?: string;
  reference_number?: string;
  created_at: string;
}

interface ViewCustomerModalProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onRecordTransaction: () => void;
}

export function ViewCustomerModal({
  customer,
  open,
  onOpenChange,
  onEdit,
  onRecordTransaction,
}: ViewCustomerModalProps) {
  const { t, language } = useLanguage();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const getBusinessTypeLabel = (type?: string) => {
    const types: { [key: string]: string } = {
      retail_store: t('businessType.retailStore'),
      provision_shop: t('businessType.provisionShop'),
      restaurant: t('businessType.restaurant'),
      market_vendor: t('businessType.marketVendor'),
      supermarket: t('businessType.supermarket'),
      other: t('businessType.other'),
    };
    return types[type || ""] || type || "N/A";
  };

  const getBirthdayInfo = () => {
    if (!customer.birthday) return null;

    const today = new Date();
    const birthday = parseISO(customer.birthday);
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birthday.getMonth(),
      birthday.getDate()
    );

    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    const daysUntil = differenceInDays(thisYearBirthday, today);
    const isToday = isSameDay(today, thisYearBirthday);

    return { daysUntil, isToday, date: birthday };
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("credit_transactions")
          .select("*")
          .eq("customer_id", customer.id)
          .order("transaction_date", { ascending: false })
          .limit(10);

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [customer.id, open]);

  const availableCredit = customer.credit_limit - customer.current_balance;
  const birthdayInfo = getBirthdayInfo();

  const getLocale = () => {
    if (language === 'fr') return 'fr-FR';
    if (language === 'ar') return 'ar-SA';
    return 'en-US';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Birthday Alert */}
          {birthdayInfo && birthdayInfo.daysUntil <= 7 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-3 flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {birthdayInfo.isToday ? (
                    <span className="font-medium text-primary">{t('dashboard.today')}!</span>
                  ) : (
                    <span>{t('dashboard.inDays').replace('{days}', birthdayInfo.daysUntil.toString())}</span>
                  )}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('customer.customerDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.birthday && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(parseISO(customer.birthday), "MMMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{getBusinessTypeLabel(customer.business_type)}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Credit Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t('customer.creditSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">{t('customer.creditLimit')}</div>
                  <div className="font-semibold">Le {customer.credit_limit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t('customer.outstanding')}</div>
                  <div className={`font-semibold ${customer.current_balance > 0 ? "text-warning" : "text-success"}`}>
                    Le {customer.current_balance.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t('customer.available')}</div>
                  <div className={`font-semibold ${availableCredit < 0 ? "text-destructive" : "text-success"}`}>
                    Le {availableCredit.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {t('customer.recentTransactions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">{t('modal.loading')}</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('customer.noTransactions')}
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                    >
                      <div>
                        <div className="font-medium capitalize">{tx.transaction_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.transaction_date).toLocaleDateString(getLocale())}
                          {tx.description && ` • ${tx.description}`}
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          tx.transaction_type === "payment" ? "text-success" : "text-warning"
                        }`}
                      >
                        {tx.transaction_type === "payment" ? "-" : "+"}Le{" "}
                        {tx.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onEdit} className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              {t('customer.editCustomer')}
            </Button>
            <Button variant="gradient" onClick={onRecordTransaction} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {t('customer.recordTransaction')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
