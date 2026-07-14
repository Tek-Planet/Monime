import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const months = parseInt(session.metadata?.months || "1");

      if (!userId) {
        console.error("No user ID in session metadata");
        return new Response(JSON.stringify({ error: "No user ID" }), { status: 400 });
      }

      // Calculate period end
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + months);

      // Get current subscription to see if we should extend
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      let periodStart = now;
      let adjustedPeriodEnd = periodEnd;

      // If user has active time remaining, extend from that end date
      if (existingSub) {
        const currentEnd = existingSub.current_period_end
          ? new Date(existingSub.current_period_end)
          : existingSub.trial_end_date
          ? new Date(existingSub.trial_end_date)
          : null;

        if (currentEnd && currentEnd > now) {
          periodStart = currentEnd;
          adjustedPeriodEnd = new Date(currentEnd);
          adjustedPeriodEnd.setMonth(adjustedPeriodEnd.getMonth() + months);
        }
      }

      const { error: updateError } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            status: "active",
            plan_type: "premium",
            current_period_start: periodStart.toISOString(),
            current_period_end: adjustedPeriodEnd.toISOString(),
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.id,
          },
          { onConflict: "user_id" }
        );

      if (updateError) {
        console.error("Failed to update subscription:", updateError);
        return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
      }

      console.log(`Subscription activated for user ${userId} until ${adjustedPeriodEnd.toISOString()}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
