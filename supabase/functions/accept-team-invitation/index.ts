import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Create a client with the user's token to verify their identity.
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Explicitly pass token — edge functions have no browser session.
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError) throw authError;
    if (!user) throw new Error("User not found for provided token");
    if (!user.email) throw new Error("User email is missing");

    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const normalizedEmail = user.email.toLowerCase();

    // --- 1. FIND THE CORRECT INVITATION ---
    const { data: pendingInvitation, error: invError } = await supabaseAdmin
      .from("organization_invitations")
      .select("id, business_id, invited_by, accessible_pages, branch_id, created_at")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (invError && invError.code === 'PGRST116') {
      return new Response(JSON.stringify({ success: true, data: { alreadyProcessed: true, message: "No single pending invitation found." } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
      });
    }
    if (invError) throw invError;

    const nowIso = new Date().toISOString();

    // --- 2. CHECK FOR PRE-EXISTING MEMBERSHIP ---
    const { data: existingMember } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("business_id", pendingInvitation.business_id)
      .eq("user_id", user.id)
      .maybeSingle();

    // --- 3. UPSERT THE MEMBER RECORD ---
    if (existingMember) {
      const { error: memberUpdateError } = await supabaseAdmin
        .from("organization_members")
        .update({
          email: normalizedEmail,
          accessible_pages: pendingInvitation.accessible_pages,
          branch_id: pendingInvitation.branch_id,
          is_active: true,
          updated_at: nowIso,
        })
        .eq("id", existingMember.id);
      if (memberUpdateError) throw memberUpdateError;
    } else {
      const { error: memberInsertError } = await supabaseAdmin.from("organization_members").insert({
        business_id: pendingInvitation.business_id,
        user_id: user.id,
        role: "member",
        email: normalizedEmail,
        accessible_pages: pendingInvitation.accessible_pages,
        branch_id: pendingInvitation.branch_id,
        invited_by: pendingInvitation.invited_by,
        invited_at: pendingInvitation.created_at,
        joined_at: nowIso,
        is_active: true,
      });
      if (memberInsertError) throw memberInsertError;
    }

    // --- 4. FINALIZE INVITATION ---
    const { error: invitationUpdateError } = await supabaseAdmin
      .from("organization_invitations")
      .update({ status: "accepted" })
      .eq("id", pendingInvitation.id);
    if (invitationUpdateError) throw invitationUpdateError;

    console.log("Invitation accepted for user:", normalizedEmail, "business:", pendingInvitation.business_id);

    return new Response(JSON.stringify({ success: true, data: { accepted: true, businessId: pendingInvitation.business_id } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error in accept-team-invitation:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
