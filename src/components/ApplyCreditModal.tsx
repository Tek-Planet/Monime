import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, FileText, Save, DollarSign } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreditApplication {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  businessAddress: string;
  yearsInBusiness: string;
  monthlyRevenue: string;
  requestedAmount: string;
  loanPurpose: string;
  repaymentPeriod: string;
  collateral: string;
  bankStatement: boolean;
  businessLicense: boolean;
  taxCertificate: boolean;
}

export function ApplyCreditModal() {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [application, setApplication] = useState<CreditApplication>({
    businessName: "MiBuks Provision Store",
    ownerName: "",
    phone: "",
    email: "",
    businessAddress: "",
    yearsInBusiness: "",
    monthlyRevenue: "",
    requestedAmount: "",
    loanPurpose: "",
    repaymentPeriod: "",
    collateral: "",
    bankStatement: false,
    businessLicense: false,
    taxCertificate: false,
  });

  const handleInputChange = (field: keyof CreditApplication, value: string | boolean) => {
    setApplication((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Credit Application:", application);
    setOpen(false);
    // Here you would typically submit to your backend
  };

  const isFormValid =
    application.ownerName && application.phone && application.requestedAmount && application.loanPurpose;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="w-full sm:w-auto">
          <CreditCard className="h-4 w-4" />
          {t("credit.getCredit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("credit.applicationForm")}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("credit.businessInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="businessName">{t("credit.businessName")}</Label>
                  <Input
                    id="businessName"
                    value={application.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerName">{t("credit.ownerName")} *</Label>
                  <Input
                    id="ownerName"
                    value={application.ownerName}
                    onChange={(e) => handleInputChange("ownerName", e.target.value)}
                    placeholder={t("credit.yourFullName")}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="phone">{t("credit.phoneNumber")} *</Label>
                  <Input
                    id="phone"
                    value={application.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+232 XX XXX XXX"
                    className="h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t("credit.emailAddress")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={application.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your@email.com"
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessAddress">{t("credit.businessAddress")}</Label>
                <Textarea
                  id="businessAddress"
                  value={application.businessAddress}
                  onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                  placeholder={t("credit.addressPlaceholder")}
                  className="min-h-[100px] text-base"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="yearsInBusiness">{t("credit.yearsInBusiness")}</Label>
                  <Select onValueChange={(value) => handleInputChange("yearsInBusiness", value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder={t("credit.selectYears")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less-than-1">{t("credit.lessThan1Year")}</SelectItem>
                      <SelectItem value="1-2">{t("credit.1to2Years")}</SelectItem>
                      <SelectItem value="3-5">{t("credit.3to5Years")}</SelectItem>
                      <SelectItem value="5-10">{t("credit.5to10Years")}</SelectItem>
                      <SelectItem value="more-than-10">{t("credit.moreThan10Years")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="monthlyRevenue">{t("credit.monthlyRevenue")}</Label>
                  <Input
                    id="monthlyRevenue"
                    type="number"
                    value={application.monthlyRevenue}
                    onChange={(e) => handleInputChange("monthlyRevenue", e.target.value)}
                    placeholder="25000"
                    className="h-12 text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t("credit.loanDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="requestedAmount">{t("credit.requestedAmount")} *</Label>
                  <Input
                    id="requestedAmount"
                    type="number"
                    value={application.requestedAmount}
                    onChange={(e) => handleInputChange("requestedAmount", e.target.value)}
                    placeholder="50000"
                    className="h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="repaymentPeriod">{t("credit.repaymentPeriod")}</Label>
                  <Select onValueChange={(value) => handleInputChange("repaymentPeriod", value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder={t("credit.selectPeriod")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3-months">{t("credit.3months")}</SelectItem>
                      <SelectItem value="6-months">{t("credit.6months")}</SelectItem>
                      <SelectItem value="12-months">{t("credit.12months")}</SelectItem>
                      <SelectItem value="24-months">{t("credit.24months")}</SelectItem>
                      <SelectItem value="36-months">{t("credit.36months")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="loanPurpose">{t("credit.loanPurpose")} *</Label>
                <Select onValueChange={(value) => handleInputChange("loanPurpose", value)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={t("credit.loanPurposePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">{t("credit.inventoryPurchase")}</SelectItem>
                    <SelectItem value="equipment">{t("credit.equipmentPurchase")}</SelectItem>
                    <SelectItem value="expansion">{t("credit.businessExpansion")}</SelectItem>
                    <SelectItem value="working-capital">{t("credit.workingCapital")}</SelectItem>
                    <SelectItem value="renovation">{t("credit.shopRenovation")}</SelectItem>
                    <SelectItem value="other">{t("productCategory.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="collateral">{t("credit.collateral")}</Label>
                <Textarea
                  id="collateral"
                  value={application.collateral}
                  onChange={(e) => handleInputChange("collateral", e.target.value)}
                  placeholder={t("credit.collateralPlaceholder")}
                  className="min-h-[100px] text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card>
            <CardHeader>
              <CardTitle>{t("credit.requiredDocuments")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("credit.documentsNote")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bankStatement"
                    checked={application.bankStatement}
                    onChange={(e) => handleInputChange("bankStatement", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="bankStatement">{t("credit.bankStatements")}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="businessLicense"
                    checked={application.businessLicense}
                    onChange={(e) => handleInputChange("businessLicense", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="businessLicense">{t("credit.businessLicense")}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="taxCertificate"
                    checked={application.taxCertificate}
                    onChange={(e) => handleInputChange("taxCertificate", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="taxCertificate">{t("credit.taxCertificate")}</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Preview */}
          {application.requestedAmount && application.repaymentPeriod && (
            <Card>
              <CardHeader>
                <CardTitle>{t("credit.loanPreview")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t("credit.requestedAmount")}:</span>
                    <span className="font-semibold">
                      Le {parseInt(application.requestedAmount || "0").toLocaleString(locale)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("credit.interestRate")}:</span>
                    <span className="font-semibold">12% - 18% APR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("credit.repaymentPeriod")}:</span>
                    <span className="font-semibold">{application.repaymentPeriod}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t("credit.processingTime")}:</span>
                    <span>{t("credit.businessDays")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="order-2 sm:order-1 h-12 text-base">
              {t("common.cancel")}
            </Button>
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="order-1 sm:order-2 h-12 text-base"
            >
              <Save className="h-4 w-4" />
              {t("credit.submitApplication")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
