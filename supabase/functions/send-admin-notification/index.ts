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

function renderEmailTemplate({ title, bodyHtml }: { title: string; bodyHtml: string }) {
  const year = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 12px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 24px 32px; background-color: #0f172a; text-align: left;">
                  <span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">MiBuks</span>
                  <span style="color: #94a3b8; font-size: 13px; margin-left: 10px; font-weight: 400;">| Smart Business Management</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px; color: #334155; font-size: 15px; line-height: 1.6;">
                  <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 600;">${title}</h2>
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px; font-weight: 500;">MiBuks — Empowering Your Business</p>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${year} MiBuks. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
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
    let bodyHtml = "";

    switch (type) {
      case "ngo_created":
        subject = "New NGO Created";
        bodyHtml = `
          <p style="margin: 0 0 12px 0;">A new NGO organisation has been registered on the platform:</p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0f172a;">${data.ngoName}</p>
          </div>
        `;
        break;
      case "ngo_member_added":
        subject = "Added to NGO";
        bodyHtml = `
          <p style="margin: 0 0 12px 0;">You have been successfully added as an active member of:</p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0f172a;">${data.ngoName}</p>
          </div>
        `;
        break;
      case "business_assigned":
        subject = "Business Assigned to NGO";
        bodyHtml = `
          <p style="margin: 0 0 12px 0;">A business profile has been assigned to an NGO:</p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 6px 0;"><strong>Business:</strong> ${data.businessName}</p>
            <p style="margin: 0;"><strong>NGO:</strong> ${data.ngoName}</p>
          </div>
        `;
        break;
      case "user_role_changed":
        subject = "User Role Changed";
        bodyHtml = `
          <p style="margin: 0 0 12px 0;">Your access role has been updated on MiBuks:</p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
            <p style="margin: 0;">New Role: <strong style="color: #2563eb; text-transform: capitalize;">${data.role}</strong></p>
          </div>
        `;
        break;
      default:
        throw new Error("Invalid notification type");
    }

    const htmlContent = renderEmailTemplate({
      title: subject,
      bodyHtml,
    });

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "MiBuks <noreply@mibukssl.com>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
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
