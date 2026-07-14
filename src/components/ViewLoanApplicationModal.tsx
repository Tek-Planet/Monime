import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, User, Building, FileText, Package, Percent, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoanApplication {
  id: string;
  application_number: string;
  status: string;
  requested_amount: number;
  approved_amount?: number;
  interest_rate?: number;
  term_months?: number;
  credit_score?: number;
  created_at: string;
  approval_date?: string;
  loan_product?: {
    name: string;
    product_type: string;
  };
  supplier?: {
    name: string;
  };
  items_to_restock?: any[];
  application_data?: any;
}

interface ViewLoanApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: LoanApplication | null;
}

export function ViewLoanApplicationModal({ open, onOpenChange, application }: ViewLoanApplicationModalProps) {
  const { t, locale } = useLanguage();
  if (!application) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "disbursed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="text-left flex-shrink">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("credit.loanApplicationDetails")}
          </DialogTitle>
          <DialogDescription>{t("credit.applicationNumber")}: {application.application_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1">
          {/* Status and Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t("credit.applicationStatus")}</span>
                <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("credit.applicationDate")}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(application.created_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                </div>
                {application.approval_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t("credit.approvalDate")}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(application.approval_date).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loan Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("credit.loanProduct")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{application.loan_product?.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {application.loan_product?.product_type} Loan
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t("credit.financialDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">{t("credit.requestedAmount")}</p>
                  <p className="text-lg font-semibold">{formatCurrency(application.requested_amount)}</p>
                </div>
                {application.approved_amount && (
                  <div>
                    <p className="text-sm font-medium">{t("credit.approvedAmount")}</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(application.approved_amount)}
                    </p>
                  </div>
                )}
                {application.interest_rate && (
                  <div>
                    <p className="text-sm font-medium">{t("credit.interestRate")}</p>
                    <p className="text-lg font-semibold">{application.interest_rate}%</p>
                  </div>
                )}
                {application.term_months && (
                  <div>
                    <p className="text-sm font-medium">{t("credit.loanTerm")}</p>
                    <p className="text-lg font-semibold">{application.term_months} {t("credit.months")}</p>
                  </div>
                )}
                {application.credit_score && (
                  <div>
                    <p className="text-sm font-medium">{t("credit.creditScoreAtApplication")}</p>
                    <p className="text-lg font-semibold">{application.credit_score}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          {application.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {t("credit.supplierInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{application.supplier.name}</p>
              </CardContent>
            </Card>
          )}

          {/* Items to Restock */}
          {application.items_to_restock && application.items_to_restock.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t("credit.itemsToRestock")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {application.items_to_restock.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{t("credit.quantity")}: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.cost || 0)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Application Data */}
          {application.application_data && Object.keys(application.application_data).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("credit.additionalInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(application.application_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
