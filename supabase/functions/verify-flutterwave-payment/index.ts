import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = claimsData.user;

    const { transaction_id, tx_ref } = await req.json();
    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "Missing transaction_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const flwSecret = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flwSecret) throw new Error("FLUTTERWAVE_SECRET_KEY not configured");

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      { headers: { Authorization: `Bearer ${flwSecret}` } },
    );
    const verifyData = await verifyRes.json();

    if (verifyData.status !== "success" || verifyData.data?.status !== "successful") {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not successful" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const txn = verifyData.data;
    const meta = txn.meta || {};
    const userId = meta.supabase_user_id;
    const months = parseInt(meta.months || "1");

    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "User mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tx_ref && txn.tx_ref !== tx_ref) {
      return new Response(JSON.stringify({ error: "tx_ref mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency: skip if this tx already activated
    const { data: existingByTx } = await adminClient
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", String(transaction_id))
      .maybeSingle();
    if (existingByTx) {
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let periodStart = now;
    const currentEnd = existingSub?.current_period_end
      ? new Date(existingSub.current_period_end)
      : existingSub?.trial_end_date
      ? new Date(existingSub.trial_end_date)
      : null;
    if (currentEnd && currentEnd > now) periodStart = currentEnd;
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + months);

    const { error: upErr } = await adminClient
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          status: "active",
          plan_type: "premium",
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          stripe_subscription_id: String(transaction_id),
        },
        { onConflict: "user_id" },
      );
    if (upErr) throw upErr;

    return new Response(
      JSON.stringify({ success: true, current_period_end: periodEnd.toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Verify error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
