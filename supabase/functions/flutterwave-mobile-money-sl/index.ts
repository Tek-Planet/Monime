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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = claimsData.user;
    const { months } = await req.json();

    if (!months || months < 1 || months > 24) {
      return new Response(JSON.stringify({ error: "Invalid months (1-24)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const flwSecret = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flwSecret) throw new Error("FLUTTERWAVE_SECRET_KEY not configured");

    const SLE_RATE = 23;
    const amount = months * 2 * SLE_RATE;
    const tx_ref = `mibuks_mm_${user.id}_${Date.now()}`;
    const origin = req.headers.get("origin") || "https://tell-me-what-todo.lovable.app";

    const payload = {
      tx_ref,
      amount,
      currency: "SLL",
      redirect_url: `${origin}/settings?subscription=verify&tx_ref=${tx_ref}`,
      customer: {
        email: user.email,
        name: user.email,
      },
      customizations: {
        title: "MiBuks Premium",
        description: `MiBuks Premium - ${months} month${months > 1 ? "s" : ""}`,
      },
      meta: {
        supabase_user_id: user.id,
        months: months.toString(),
      },
    };

    const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flwSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const flwData = await flwRes.json();
    console.log("Flutterwave MM-SL response:", flwRes.status, JSON.stringify(flwData));

    if (flwData.status !== "success") {
      throw new Error(flwData.message || `Flutterwave failed (${flwRes.status})`);
    }

    return new Response(
      JSON.stringify({
        url: flwData.data?.link,
        tx_ref,
        message: "Continue to Flutterwave checkout",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("MM-SL error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
