import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    console.log(body, invitationId, branchId, 'Logging')

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

      console.log("User already exists, sending notification email:", invitation.email);

      const loginUrl = `${base}/auth`;
      const businessName = invitation.businesses?.business_name || "a business";

      const emailResponse = await resend.emails.send({
        from: "MiBuks <info@mibuks.com>",
        to: [invitation.email],
        subject: `You've been invited to join ${businessName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">You've Been Invited!</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hello! You have been invited to join <strong>${businessName}</strong> as a team member on MiBuks.
              </p>
              <p style="font-size: 16px; margin-bottom: 25px;">
                Since you already have an account, simply log in to access the business and start collaborating with your team.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Log In Now
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
                Once logged in, you'll have access to the pages that have been assigned to you by the business owner.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Notification email sent successfully:", emailResponse);
      data = { message: "Notification sent to existing user", emailResponse };
    } else {
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

      if (result.error) {
        console.error("Error sending invitation:", result.error);

        // Handle rate limit specifically
        if (result.error.status === 429 || result.error.message?.includes("rate limit")) {
          return new Response(
            JSON.stringify({ error: "Email rate limit exceeded. Please wait a few minutes and try again." }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 429,
            }
          );
        }

        throw result.error;
      }

      data = result.data;
      console.log("Invitation sent successfully to:", invitation.email);
    }

    return new Response(JSON.stringify({ success: true, data }), {
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

