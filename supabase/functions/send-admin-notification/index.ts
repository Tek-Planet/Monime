import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "ngo_created" | "ngo_member_added" | "business_assigned" | "user_role_changed";
  recipientEmail: string;
  data: {
    ngoName?: string;
    businessName?: string;
    userName?: string;
    role?: string;
    [key: string]: any;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { type, recipientEmail, data } = (await req.json()) as NotificationRequest;

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "ngo_created":
        subject = "New NGO Created";
        htmlContent = `
          <h2>New NGO Created</h2>
          <p>A new NGO has been created: <strong>${data.ngoName}</strong></p>
        `;
        break;
      case "ngo_member_added":
        subject = "Added to NGO";
        htmlContent = `
          <h2>You've been added to an NGO</h2>
          <p>You have been added as a member of <strong>${data.ngoName}</strong></p>
        `;
        break;
      case "business_assigned":
        subject = "Business Assigned to NGO";
        htmlContent = `
          <h2>Business Assigned</h2>
          <p>The business <strong>${data.businessName}</strong> has been assigned to <strong>${data.ngoName}</strong></p>
        `;
        break;
      case "user_role_changed":
        subject = "User Role Changed";
        htmlContent = `
          <h2>Your Role Has Been Updated</h2>
          <p>Your role has been changed to: <strong>${data.role}</strong></p>
        `;
        break;
      default:
        throw new Error("Invalid notification type");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Admin Notifications <info@mibuks.com>",
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
