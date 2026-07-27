import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, documentType, documentData, pdfBase64, fileName } = await req.json();

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "MiBuks <noreply@mibukssl.com>";

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; color: #334155;">Please find your attached <strong>${documentType}</strong> document attached below.</p>
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Attachment Name:</strong> ${fileName || `${documentType}.pdf`}</p>
      </div>
      <p style="margin: 0; color: #64748b; font-size: 13px;">If you have any questions, feel free to reply or contact support.</p>
    `;

    const htmlContent = renderEmailTemplate({
      title: subject || "Document Shared with You",
      bodyHtml,
    });

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: htmlContent,
      attachments: [{
        filename: fileName,
        content: pdfBase64,
        contentType: "application/pdf",
      }],
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Email Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});