import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    // Validate JWT explicitly
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Invalid authentication token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const body = await req.json().catch(() => ({}));
    const { invitationId, redirectTo: redirectToFromClient, branchId } = body;

    const originHeader = req.headers.get("origin") || "";
    const defaultBase = originHeader || (Deno.env.get("SITE_URL") ?? "");
    const base = defaultBase.replace(/\/$/, "");
    const redirectTo = redirectToFromClient || (base ? `${base}/auth?type=invite` : undefined);

    // Persist branch assignment on invitation if provided by client
    if (typeof branchId !== "undefined") {
      await supabaseAdmin
        .from("organization_invitations")
        .update({ branch_id: branchId ?? null })
        .eq("id", invitationId);
    }

    // Fetch the invitation details
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("organization_invitations")
      .select("*, businesses(business_name)")
      .eq("id", invitationId)
      .single();

    if (inviteError || !invitation) {
      throw new Error("Invitation not found");
    }

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .eq("email", invitation.email.toLowerCase())
      .maybeSingle();

    const userExists = !!existingProfile;
    const inviteUrl = `${base}/auth?email=${encodeURIComponent(invitation.email)}&type=invite`;
    let emailSent = false;
    let emailError = null;
    let data;

    if (userExists && existingProfile?.user_id) {
      const nowIso = new Date().toISOString();

      const { data: existingMember } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("business_id", invitation.business_id)
        .eq("user_id", existingProfile.user_id)
        .maybeSingle();

      if (existingMember?.id) {
        const { error: memberUpdateError } = await supabaseAdmin
          .from("organization_members")
          .update({
            email: invitation.email,
            accessible_pages: invitation.accessible_pages,
            branch_id: invitation.branch_id ?? null,
            is_active: true,
            updated_at: nowIso,
          })
          .eq("id", existingMember.id);

        if (memberUpdateError) throw memberUpdateError;
      } else {
        const { error: memberInsertError } = await supabaseAdmin
          .from("organization_members")
          .insert({
            business_id: invitation.business_id,
            user_id: existingProfile.user_id,
            email: invitation.email,
            role: "member",
            accessible_pages: invitation.accessible_pages,
            branch_id: invitation.branch_id ?? null,
            invited_by: invitation.invited_by,
            invited_at: nowIso,
            joined_at: nowIso,
            is_active: true,
          });

        if (memberInsertError) throw memberInsertError;
      }

      await supabaseAdmin
        .from("organization_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      console.log("User already exists, attempting notification email:", invitation.email);

      const loginUrl = `${base}/auth`;
      const businessName = invitation.businesses?.business_name || "a business";

      const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "MiBuks <noreply@mibukssl.com>";

      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const resendClient = new Resend(resendKey);
          await resendClient.emails.send({
            from: fromEmail,
            to: [invitation.email],
            subject: `You've been invited to join ${businessName}`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: sans-serif; padding: 20px;">
                <h2>You've Been Invited!</h2>
                <p>You have been invited to join <strong>${businessName}</strong> on MiBuks.</p>
                <p><a href="${loginUrl}" style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Log In Now</a></p>
              </body>
              </html>
            `,
          });
          emailSent = true;
        }
      } catch (err: any) {
        console.warn("Resend email failed:", err?.message || err);
        emailError = err?.message || "Email provider unavailable";
      }

      data = { message: "Notification processed for existing user", emailSent, emailError, inviteUrl };
    } else {
      // Try sending invite email via Supabase Admin or Resend
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        try {
          const resendClient = new Resend(resendKey);
          const businessName = invitation.businesses?.business_name || "a business";
          await resendClient.emails.send({
            from: fromEmail,
            to: [invitation.email],
            subject: `Invitation to join ${businessName} on MiBuks`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: sans-serif; padding: 20px;">
                <h2>Team Invitation</h2>
                <p>You have been invited to join <strong>${businessName}</strong> on MiBuks.</p>
                <p><a href="${inviteUrl}" style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Accept Invitation & Sign Up</a></p>
                <p style="color: #666; font-size: 12px;">Link: ${inviteUrl}</p>
              </body>
              </html>
            `,
          });
          emailSent = true;
        } catch (rErr: any) {
          console.warn("Resend invite failed, falling back to auth invite:", rErr?.message || rErr);
        }
      }

      if (!emailSent) {
        try {
          const result = await supabaseAdmin.auth.admin.inviteUserByEmail(invitation.email, {
            redirectTo,
            data: {
              business_name: invitation.businesses?.business_name,
              business_id: invitation.business_id,
              invitation_id: invitation.id,
              branch_id: invitation.branch_id ?? null,
              password_set: false,
            },
          });
          if (!result.error) {
            emailSent = true;
            data = result.data;
          } else {
            console.warn("Supabase inviteUserByEmail failed:", result.error.message);
            emailError = result.error.message;
          }
        } catch (aErr: any) {
          console.warn("Supabase auth invite error:", aErr?.message || aErr);
          emailError = aErr?.message || "Auth mailer unavailable";
        }
      }

      data = { message: emailSent ? "Invitation sent successfully" : "Invitation created (email sending pending/bypassed)", emailSent, emailError, inviteUrl };
    }

    return new Response(JSON.stringify({ success: true, emailSent, inviteUrl, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);

    const status = error?.status === 429 ? 429 : 500;
    const message = error?.status === 429
      ? "Email rate limit exceeded. Please wait a few minutes and try again."
      : error?.message || "Unknown error";

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
