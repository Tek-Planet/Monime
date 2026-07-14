// MSG91 - Send OTP via SMS
// Public endpoint (no JWT). Rate limits enforced by MSG91 server-side.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return new Response(JSON.stringify({ error: "phone required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TEMPORARY BYPASS: MSG91 account pending verification.
    // Skip actually sending an SMS and return success so the frontend
    // can proceed. Revert this block once MSG91 is approved.
    const BYPASS_OTP = true;
    if (BYPASS_OTP) {
      console.log("MSG91 bypass enabled — skipping SMS send for", phone);
      return new Response(JSON.stringify({ success: true, bypass: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const authKey = Deno.env.get("MSG91_AUTH_KEY");
    const templateId = Deno.env.get("MSG91_TEMPLATE_ID");
    const senderId = Deno.env.get("MSG91_SENDER_ID");

    if (!authKey || !templateId) {
      return new Response(
        JSON.stringify({ error: "MSG91 not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // MSG91 expects mobile with country code, no '+'
    const mobile = phone.replace(/[^\d]/g, "");

    const params = new URLSearchParams({
      template_id: templateId,
      mobile,
      otp_length: "6",
      otp_expiry: "10",
    });
    if (senderId) params.set("sender", senderId);

    const resp = await fetch(
      `https://control.msg91.com/api/v5/otp?${params.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: authKey,
        },
        body: JSON.stringify({}),
      },
    );

    const data = await resp.json();
    console.log("MSG91 send response", data);

    if (data.type !== "success") {
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-otp error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});