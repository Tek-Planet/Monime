import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, documentType, documentData, pdfBase64, fileName } = await req.json();

    const { data, error } = await resend.emails.send({
      from: "MiBuks <noreply@updates.mibukssl.com>",   // Your domain
      to: [to],
      subject: subject,
      html: `<h2>${subject}</h2><p>Please find the attached ${documentType}.</p>`,
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