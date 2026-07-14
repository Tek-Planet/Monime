// MSG91 - Verify OTP, then mint a Supabase session by resetting
// the user's password and returning it for signInWithPassword.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function randomPassword(len = 40) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, len);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, otp, password: providedPassword, mode } = await req.json();
    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: "phone and otp required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const authKey = Deno.env.get("MSG91_AUTH_KEY");
    // TEMPORARY BYPASS: MSG91 account pending verification.
    // Skip the OTP verification step and mint a session for the phone
    // number directly. Revert once MSG91 is approved.
    const BYPASS_OTP = true;
    if (!authKey && !BYPASS_OTP) {
      return new Response(JSON.stringify({ error: "MSG91 not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const mobile = String(phone).replace(/[^\d]/g, "");

    // 1) Verify OTP with MSG91 (skipped when BYPASS_OTP is on)
    if (!BYPASS_OTP) {
      const verifyResp = await fetch(
        `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=${encodeURIComponent(mobile)}`,
        { method: "GET", headers: { authkey: authKey! } },
      );
      const verifyData = await verifyResp.json();
      console.log("MSG91 verify response", verifyData);

      if (verifyData.type !== "success") {
        return new Response(
          JSON.stringify({ error: verifyData.message || "Invalid OTP" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      console.log("MSG91 bypass enabled — skipping OTP verify for", mobile);
    }


    // 2) Find or create Supabase user by phone
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const e164 = `+${mobile}`;
    // If the caller supplied a password (signup / password-set flow) use it so
    // the user can sign in with signInWithPassword afterwards. Otherwise mint
    // a random one (legacy OTP-only flow).
    const password = providedPassword && String(providedPassword).length >= 6
      ? String(providedPassword)
      : randomPassword();

    // Search for existing user with this phone (paginate lightly)
    let userId: string | null = null;
    let page = 1;
    const perPage = 200;
    while (page <= 20) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const match = data.users.find((u) => u.phone === mobile || u.phone === e164);
      if (match) {
        userId = match.id;
        break;
      }
      if (data.users.length < perPage) break;
      page++;
    }

    // In signin mode, do not create a new user and do not rotate the password.
    if (mode === "signin") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "No account found for this phone number" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ success: true, phone: mobile }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (userId) {
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        password,
        phone_confirm: true,
      });
      if (updErr) throw updErr;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        phone: mobile,
        password,
        phone_confirm: true,
      });
      if (createErr) throw createErr;
      userId = created.user?.id ?? null;
    }

    return new Response(
      JSON.stringify({ success: true, phone: mobile, password }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("verify-otp error", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
