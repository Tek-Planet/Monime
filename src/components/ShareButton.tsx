import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ShareButtonProps {
  documentType: "sale" | "invoice" | "report";
  documentData: any;
  generatePDF: () => jsPDF;
  subject: string;
  fileName: string;
  whatsappMessage?: string;
  iconOnly?: boolean;
  toastLabel?: string;
}

export function ShareButton({
  documentType,
  documentData,
  generatePDF,
  subject,
  fileName,
  whatsappMessage,
  iconOnly = false,
  toastLabel,
}: ShareButtonProps) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleWhatsAppShare = async () => {
    try {
      // Generate PDF
      const pdf = generatePDF();
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      // Check if Web Share API with files is supported (mobile only)
      const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });

      if (canShareFiles) {
        try {
          await navigator.share({
            files: [file],
            title: subject,
            text: whatsappMessage || `Check out this ${documentType}`,
          });
          return;
        } catch (shareError: any) {
          // User cancelled
          if (shareError.name === "AbortError") {
            return;
          }
          console.log("Web Share API failed, trying fallback:", shareError);
        }
      }

      // Desktop fallback: Download PDF and open WhatsApp with text
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Open WhatsApp with text message
      const message = `${whatsappMessage || `Check out this ${documentType}`}\n\nI've attached the PDF document for your review.`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");

      toast({
        title: "PDF Downloaded",
        description: "WhatsApp opened - please attach the downloaded PDF to your message",
      });
    } catch (error: any) {
      console.error("Error sharing via WhatsApp:", error);
      toast({
        title: "Sharing failed",
        description: "Please try again or share the document manually",
        variant: "destructive",
      });
    }
  };

 const handleEmailShare = async () => {
  if (!email) {
    toast({ title: "Email required", description: "Please enter an email address", variant: "destructive" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
    return;
  }

  setSending(true);

  try {
    const pdf = generatePDF();
    const pdfBase64 = pdf.output("datauristring").split(",")[1];

    console.log("Sending PDF, size:", pdfBase64.length, "chars");

    const { data, error } = await supabase.functions.invoke("send-shared-document", {
      body: {
        to: email,
        subject: subject,
        documentType: documentType,
        documentData: documentData,
        pdfBase64: pdfBase64,
        fileName: fileName,
      },
      // Add timeout
    });

    if (error) throw error;

    toast({
      title: "Email sent",
      description: `${toastLabel || documentType} has been sent to ${email}`,
    });

    setShowEmailDialog(false);
    setEmail("");
  } catch (error: any) {
    console.error("Full Send Error:", error);
    toast({
      title: "Failed to send email",
      description: error.message || "Request timed out or failed",
      variant: "destructive",
    });
  } finally {
    setSending(false);
  }
};

  return (
    <>
      <div className="flex gap-2">
        {iconOnly ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => setShowEmailDialog(true)} className="h-8 w-8">
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleWhatsAppShare} className="h-8 w-8">
              <Share2 className="h-4 w-4 md:hidden" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2 md:hidden"
            >
              <Share2 className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailDialog(true)}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </>
        )}
      </div>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="z-[70]">
          <DialogHeader>
            <DialogTitle>Share via Email</DialogTitle>
            <DialogDescription>Enter the email address to send this {documentType}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !sending) {
                    handleEmailShare();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleEmailShare} disabled={sending}>
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
