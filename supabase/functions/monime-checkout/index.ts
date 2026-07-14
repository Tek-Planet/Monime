import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONIME_API_URL = "https://api.monime.io/v1/checkout-sessions";

const getRequiredEnv = (names: string[]) => {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim();
    if (value) return value;
  }
  return null;
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

    // Body may arrive as JSON object or stringified JSON (some callers stringify)
    let body: any = null;
    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
      if (typeof body === "string") body = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountMajor = Number(body?.amount);
    const rawCurrency = String(body?.currency || "SLE").toUpperCase();
    // Monime uses ISO 4217 SLE (SLL is deprecated)
    const currency = rawCurrency === "SLL" ? "SLE" : rawCurrency;
    const phoneNumber = String(body?.phone_number || body?.phoneNumber || "").trim();
    const invoiceId = body?.invoice_id || body?.invoiceId || null;
    const invoiceNumber = body?.invoice_number || null;
    const reference = body?.reference_number || body?.reference || crypto.randomUUID();

    if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert to minor units (cents)
    const amountMinor = Math.round(amountMajor * 100);

    const spaceId = getRequiredEnv(["MONIME_SPACE_ID", "MONIME_TEST_SPACE_ID"]);
    const accessToken = getRequiredEnv(["MONIME_TOKEN", "MONIME_SECRET_TOKEN", "MONIME_TEST_SECRET_TOKEN"]);

    if (!spaceId || !accessToken) {
      console.error("Monime checkout missing credentials", {
        hasSpaceId: Boolean(spaceId),
        hasToken: Boolean(accessToken),
      });
      return new Response(JSON.stringify({ error: "Monime checkout is not configured yet." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || req.headers.get("referer") || "https://tell-me-what-todo.lovable.app";
    const successUrl = body?.success_url || `${origin}/?monime=success&ref=${encodeURIComponent(reference)}`;
    const cancelUrl = body?.cancel_url || `${origin}/?monime=cancel&ref=${encodeURIComponent(reference)}`;

    const displayName = invoiceNumber
      ? `Invoice ${invoiceNumber}`
      : body?.name || "Payment";

    const monimePayload: any = {
      name: displayName,
      description: body?.notes || body?.description || displayName,
      reference: String(reference),
      successUrl,
      cancelUrl,
      lineItems: [
        {
          type: "custom",
          name: displayName,
          quantity: 1,
          price: { currency, value: amountMinor },
          reference: String(reference),
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        user_email: user.email ?? null,
        source: body?.source || "frontend",
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        reference_number: body?.reference_number || null,
        notes: body?.notes || null,
        phone_number: phoneNumber || null,
        amount: amountMajor,
        months: body?.months || 1,
      },
    };

    const idempotencyKey = `${user.id}-${reference}-${amountMinor}`.slice(0, 128);

    const monimeResponse = await fetch(MONIME_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Monime-Space-Id": spaceId,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(monimePayload),
    });

    const monimeText = await monimeResponse.text();
    let monimeData: any = {};
    try {
      monimeData = JSON.parse(monimeText);
    } catch {
      monimeData = { raw: monimeText };
    }

    if (!monimeResponse.ok || monimeData?.success === false) {
      const errMsg =
        monimeData?.messages?.[0] ||
        monimeData?.message ||
        monimeData?.error ||
        `Monime request failed (${monimeResponse.status})`;
      console.error("Monime API error:", monimeResponse.status, monimeData);
      return new Response(
        JSON.stringify({ error: errMsg, details: monimeData }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = monimeData?.result || monimeData?.data || monimeData;
    const checkoutUrl = result?.redirectUrl || result?.redirect_url || null;
    const sessionId = result?.id || null;

    return new Response(
      JSON.stringify({
        success: true,
        provider: "monime",
        checkout_url: checkoutUrl,
        session_id: sessionId,
        reference: String(reference),
        message: checkoutUrl
          ? "Redirecting you to Monime to complete payment."
          : "Monime checkout session created.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Monime checkout error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Monime checkout failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
