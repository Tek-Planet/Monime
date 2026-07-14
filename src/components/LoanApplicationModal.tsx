import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLoans, type LoanProduct, type PreQualificationResult } from "@/hooks/useLoans";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface LoanApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

type ApplicationStep = "products" | "prequalify" | "application" | "verification" | "approval";

export function LoanApplicationModal({ open, onOpenChange, onClose }: LoanApplicationModalProps) {
  const [currentStep, setCurrentStep] = useState<ApplicationStep>("products");
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [preQualResult, setPreQualResult] = useState<PreQualificationResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    Array<{ id: string; name: string; quantity: number; unit_price: number }>
  >([]);
  const [applicationNotes, setApplicationNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const { loanProducts, checkPreQualification, createLoanApplication } = useLoans();
  const { suppliers } = useSuppliers();
  const { inventory } = useInventory();
  const { toast } = useToast();

  const handleProductSelect = (product: LoanProduct) => {
    setSelectedProduct(product);
    setRequestedAmount("");
    setSelectedSupplierId("");
    setSelectedItems([]);
    setCurrentStep("prequalify");
  };

  const handlePreQualification = async () => {
    if (!selectedProduct || !requestedAmount) return;

    const amount = parseFloat(requestedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid requested amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await checkPreQualification(selectedProduct.id, amount, selectedSupplierId || undefined);
      setPreQualResult(result);

      if (result.qualified) {
        setCurrentStep("application");
        toast({
          title: "Pre-qualified!",
          description: `You're pre-qualified for up to ${formatCurrency(result.max_amount)}`,
        });
      } else {
        toast({
          title: "Pre-qualification",
          description: result.reasons?.[0] || "Please review your eligibility",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Pre-qualification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (itemId: string, quantity: number) => {
    const item = inventory.find((inv) => inv.id === itemId);
    if (!item) return;

    let newItems: Array<{ id: string; name: string; quantity: number; unit_price: number }>;

    const existingIndex = selectedItems.findIndex((i) => i.id === itemId);
    if (existingIndex >= 0) {
      newItems = [...selectedItems];
      if (quantity > 0) {
        newItems[existingIndex] = { ...newItems[existingIndex], quantity };
      } else {
        newItems.splice(existingIndex, 1);
      }
    } else if (quantity > 0) {
      newItems = [
        ...selectedItems,
        {
          id: itemId,
          name: item.name,
          quantity,
          unit_price: item.unit_price,
        },
      ];
    } else {
      newItems = selectedItems;
    }

    setSelectedItems(newItems);

    // Keep requested amount fixed from pre-qualification; do not auto-overwrite with item totals
  };

  const handleSubmitApplication = async () => {
    if (!selectedProduct || !preQualResult?.qualified) return;

    setLoading(true);
    // Validation: prevent submission if selected items exceed requested amount
    const requested = parseFloat(requestedAmount || "0");
    if (selectedProduct.product_type === "inventory" && totalItemsValue > requested) {
      toast({
        title: "Amount Exceeded",
        description: `Selected items total (${formatCurrency(totalItemsValue)}) exceeds your requested amount (${formatCurrency(requested)})`,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    try {
      const applicationData = {
        loan_product_id: selectedProduct.id,
        supplier_id: selectedSupplierId || undefined,
        requested_amount: parseFloat(requestedAmount),
        items_to_restock: selectedItems,
        application_data: {
          notes: applicationNotes,
          selected_supplier: selectedSupplierId,
          total_items: selectedItems.length,
        },
      };

      await createLoanApplication(applicationData);
      setCurrentStep("approval");

      toast({
        title: "Application Submitted",
        description: "Your loan application has been submitted for review",
      });
    } catch (error) {
      console.error("Application submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep("products");
    setSelectedProduct(null);
    setSelectedSupplierId("");
    setRequestedAmount("");
    setPreQualResult(null);
    setSelectedItems([]);
    setApplicationNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const totalItemsValue = selectedItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink">
          <DialogTitle>
            {currentStep === "products" && "Select Loan Product"}
            {currentStep === "prequalify" && "Pre-Qualification Check"}
            {currentStep === "application" && "Loan Application"}
            {currentStep === "verification" && "Verification"}
            {currentStep === "approval" && "Application Status"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Product Selection */}
        {currentStep === "products" && (
          <div className="space-y-4 overflow-y-auto flex-1">
            <div className="grid gap-4">
              {loanProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedProduct?.id === product.id ? "border-primary" : ""
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">{product.interest_rate}% APR</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Amount Range</p>
                        <p className="text-muted-foreground">
                          {formatCurrency(product.min_amount)} - {formatCurrency(product.max_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Term</p>
                        <p className="text-muted-foreground">{product.term_months} months</p>
                      </div>
                      <div>
                        <p className="font-medium">Min Credit Score</p>
                        <p className="text-muted-foreground">{product.min_credit_score}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Pre-Qualification */}
        {currentStep === "prequalify" && selectedProduct && (
          <div className="space-y-6 overflow-y-auto flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Selected Product: {selectedProduct.name}
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Select Supplier (Optional)</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.product_category || "General"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Requested Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder={`Min: ${formatCurrency(selectedProduct.min_amount)}`}
                />
              </div>

              <Button onClick={handlePreQualification} className="w-full" disabled={loading || !requestedAmount}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Eligibility...
                  </>
                ) : (
                  "Check Pre-Qualification"
                )}
              </Button>

              {preQualResult && (
                <Card className={preQualResult.qualified ? "border-green-200" : "border-red-200"}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {preQualResult.qualified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <h3 className="font-semibold">
                        {preQualResult.qualified ? "Pre-Qualified!" : "Not Pre-Qualified"}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Credit Score: {preQualResult.credit_score}</p>
                    {preQualResult.qualified && (
                      <p className="text-sm text-muted-foreground">
                        Maximum Amount: {formatCurrency(preQualResult.max_amount)}
                      </p>
                    )}
                    {preQualResult.reasons && (
                      <div className="mt-2">
                        {preQualResult.reasons.map((reason, index) => (
                          <p key={index} className="text-sm text-red-600">
                            {reason}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Application Form */}
        {currentStep === "application" && preQualResult?.qualified && (
          <div className="space-y-6 overflow-y-auto flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">
                  Requested Amount: {formatCurrency(parseFloat(requestedAmount))}
                </CardTitle>
                <CardDescription>Maximum qualified: {formatCurrency(preQualResult.max_amount)}</CardDescription>
              </CardHeader>
            </Card>

            {selectedProduct.product_type === "inventory" && (
              <div>
                <Label>Select Items to Restock</Label>
                <div className="grid gap-2 mt-2 max-h-60 overflow-y-auto">
                  {inventory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.unit_price)} each • Stock: {item.stock_quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="w-20"
                          onChange={(e) => handleItemSelection(item.id, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {selectedItems.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded">
                    <h4 className="font-medium">Selected Items</h4>
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span>{formatCurrency(item.quantity * item.unit_price)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 font-medium">Total: {formatCurrency(totalItemsValue)}</div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={applicationNotes}
                onChange={(e) => setApplicationNotes(e.target.value)}
                placeholder="Any additional information about your loan request..."
              />
            </div>

            {totalItemsValue > parseFloat(requestedAmount) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">
                    Total items value ({formatCurrency(totalItemsValue)}) exceeds your requested amount (
                    {formatCurrency(parseFloat(requestedAmount))})
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmitApplication}
              className="w-full"
              disabled={
                loading ||
                (selectedProduct.product_type === "inventory" && selectedItems.length === 0) ||
                totalItemsValue > parseFloat(requestedAmount) ||
                !requestedAmount ||
                parseFloat(requestedAmount) <= 0
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                "Submit Loan Application"
              )}
            </Button>
          </div>
        )}

        {/* Step 5: Approval Status */}
        {currentStep === "approval" && (
          <div className="text-center space-y-4 overflow-y-auto flex-1">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
            <h3 className="text-lg font-semibold">Application Submitted</h3>
            <p className="text-muted-foreground">
              Your loan application has been submitted and is under review. You will receive updates on the status via
              SMS and in your dashboard.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== "approval" && (
          <div className="flex justify-between pt-4 flex-1 overflow-y-auto">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === "prequalify") setCurrentStep("products");
                else if (currentStep === "application") setCurrentStep("prequalify");
              }}
              disabled={currentStep === "products"}
            >
              Back
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
