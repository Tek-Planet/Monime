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

    const source = String(metadata?.source || "").trim();
    const supabaseUserId = String(metadata?.supabase_user_id || "").trim();
    const months = parseInt(metadata?.months || "1");
    const amountMajor = Number(metadata?.amount || 0);

    const isPaid =
      eventName.endsWith(".paid") ||
      eventName.endsWith(".completed") ||
      eventName.endsWith(".successful") ||
      ["paid", "successful", "completed", "success"].includes(status);

    // 1. Check if source is subscription upgrade
    if (source === "upgrade-modal" || source === "upgrade_modal") {
      if (!supabaseUserId) {
        return new Response(
          JSON.stringify({ received: true, error: "Missing supabase_user_id in upgrade metadata" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!isPaid) {
        return new Response(
          JSON.stringify({ received: true, event: eventName, status, note: "Upgrade payment not completed yet" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Idempotency: check if reference already processed
      const { data: existingByTx } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", String(reference))
        .maybeSingle();

      if (existingByTx) {
        return new Response(
          JSON.stringify({ received: true, alreadyProcessed: true, note: "Subscription already activated" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = new Date();
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", supabaseUserId)
        .maybeSingle();

      let periodStart = now;
      const currentEnd = existingSub?.current_period_end
        ? new Date(existingSub.current_period_end)
        : existingSub?.trial_end_date
        ? new Date(existingSub.trial_end_date)
        : null;

      if (currentEnd && currentEnd > now) {
        periodStart = currentEnd;
      }
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + months);

      const { error: upErr } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: supabaseUserId,
            status: "active",
            plan_type: "premium",
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            stripe_subscription_id: String(reference),
          },
          { onConflict: "user_id" }
        );

      if (upErr) throw upErr;

      return new Response(
        JSON.stringify({ received: true, user_id: supabaseUserId, subscription_status: "active", period_end: periodEnd.toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Handle standard invoice payment
    const invoiceId = String(metadata?.invoice_id || "").trim();
    const invoiceNumber = String(metadata?.invoice_number || "").trim();

    if (!invoiceId && !invoiceNumber) {
      return new Response(
        JSON.stringify({ received: true, note: "No invoice or subscription reference in metadata", event: eventName }),
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

    // Idempotency check for invoice payment
    const paymentRefNote = `Monime payment reference: ${reference}`;
    if (invoice.notes && invoice.notes.includes(paymentRefNote)) {
      return new Response(
        JSON.stringify({ received: true, note: "Invoice payment already recorded", invoice_id: invoice.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine paid amount
    const paymentAmount = amountMajor > 0 ? amountMajor : (invoice.total_amount || 0) - (invoice.paid_amount || 0);
    const nextPaidAmount = (invoice.paid_amount || 0) + paymentAmount;
    const nextStatus =
      nextPaidAmount >= (invoice.total_amount || 0) ? "paid" : "partial";

    const paymentNote = `Payment of Le ${paymentAmount.toLocaleString()} received on ${new Date().toLocaleDateString()} via Monime (${paymentRefNote})`;
    const updatedNotes = invoice.notes
      ? `${invoice.notes}\n\n${paymentNote}`
      : paymentNote;

    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: nextStatus,
        paid_amount: nextPaidAmount,
        notes: updatedNotes,
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
