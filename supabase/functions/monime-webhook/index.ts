import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "content-type, monime-signature, x-monime-signature",
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const signature =
      req.headers.get("monime-signature") ||
      req.headers.get("Monime-Signature") ||
      req.headers.get("x-monime-signature") ||
      req.headers.get("X-Monime-Signature") ||
      "";

    const expectedSecret = Deno.env.get("MONIME_WEBHOOK_SECRET");
    if (expectedSecret && signature) {
      const computed = await hmacSha256Hex(expectedSecret, bodyText);
      // Accept plain hex or "sha256=<hex>" style
      const provided = signature.replace(/^sha256=/, "").trim().toLowerCase();
      if (computed !== provided) {
        console.error("Monime webhook signature mismatch");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(bodyText);
    } catch {
      payload = { raw: bodyText };
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const eventName: string = payload?.event?.name || "";
    const data = payload?.data || {};
    const metadata = data?.metadata || {};

    const status = String(data?.status || "").toLowerCase();
    const reference = String(data?.reference || "").trim();
    const invoiceId = String(metadata?.invoice_id || "").trim();
    const invoiceNumber = String(metadata?.invoice_number || "").trim();

    const isPaid =
      eventName.endsWith(".paid") ||
      eventName.endsWith(".completed") ||
      eventName.endsWith(".successful") ||
      ["paid", "successful", "completed", "success"].includes(status);

    if (!invoiceId && !invoiceNumber) {
      return new Response(
        JSON.stringify({ received: true, note: "No invoice reference in metadata", event: eventName }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!isPaid) {
      return new Response(
        JSON.stringify({ received: true, event: eventName, status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let invoiceQuery = supabase
      .from("invoices")
      .select("id, status, paid_amount, total_amount, notes");
    if (invoiceId) invoiceQuery = invoiceQuery.eq("id", invoiceId);
    else invoiceQuery = invoiceQuery.eq("invoice_number", invoiceNumber);

    const { data: invoice, error: fetchError } = await invoiceQuery.limit(1).maybeSingle();
    if (fetchError) throw fetchError;
    if (!invoice) {
      return new Response(
        JSON.stringify({ received: true, note: "Invoice not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const nextPaidAmount = Math.max(invoice.paid_amount || 0, invoice.total_amount || 0);
    const nextStatus =
      nextPaidAmount >= (invoice.total_amount || 0) ? "paid" : invoice.status;

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: nextStatus,
        paid_amount: nextPaidAmount,
        notes: `${invoice.notes || ""}\n\nMonime marked paid via ${reference || eventName}`.trim(),
      })
      .eq("id", invoice.id);
    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ received: true, invoice_id: invoice.id, status: nextStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Monime webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Monime webhook failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
