import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── FAQ knowledge base ────────────────────────────────────────────────
const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["create account", "sign up", "register", "get started"],
    answer:
      "To create an account, go to the login page and click **Sign Up**. Enter your email and a password, then follow the onboarding steps to set up your business profile.",
  },
  {
    keywords: ["add team", "invite member", "team member"],
    answer:
      "Navigate to **Settings → Team Management**, click **Invite Member**, enter their email, choose their role and page access, then send the invitation.",
  },
  {
    keywords: ["record sale", "add sale", "new sale"],
    answer:
      "Go to the **Sales** page and click **Record Sale**. Select products or enter a custom item, choose the payment method, and save.",
  },
  {
    keywords: ["invoice", "create invoice", "generate invoice"],
    answer:
      "Open the **Invoices** page, click **Create Invoice**, add line items and a customer, set a due date, then save. You can also generate a PDF receipt.",
  },
  {
    keywords: ["inventory", "stock", "track inventory", "add product"],
    answer:
      "Head to the **Inventory** page to add, edit, or restock items. You can set minimum stock levels to get low-stock alerts on your dashboard.",
  },
  {
    keywords: ["expense", "add expense", "track expense"],
    answer:
      "Go to the **Expenses** page, click **Add Expense**, fill in the amount, category, description, and payment method, then save.",
  },
  {
    keywords: ["customer", "add customer", "manage customer", "credit"],
    answer:
      "Visit the **Customers** page to add or manage customers. You can set credit limits and track balances from the **Credit** page.",
  },
  {
    keywords: ["supplier", "add supplier"],
    answer:
      "Go to the **Suppliers** page to add suppliers, record payments, and track outstanding balances.",
  },
  {
    keywords: ["report", "analytics", "export"],
    answer:
      "The **Reports** page shows revenue charts, expense breakdowns, and profit summaries. You can export data to PDF.",
  },
  {
    keywords: ["branch", "multi branch", "branches"],
    answer:
      "Enable branches in **Settings → Branch Management**. You can create branches, assign team members to specific branches, and filter data by branch.",
  },
  {
    keywords: ["pin", "pin lock", "security pin"],
    answer:
      "Set up a security PIN in **Settings → PIN Settings**. Once enabled, MiBuks will lock after idle time and require your PIN to unlock.",
  },
  {
    keywords: ["language", "krio", "french", "arabic", "translate"],
    answer:
      "Click the language icon in the top navigation bar to switch between English, Krio, French, and Arabic.",
  },
  {
    keywords: ["delete account", "remove account"],
    answer:
      "To delete your account, please contact support at **support@mibuks.com**. Note that this action is irreversible.",
  },
  {
    keywords: ["loan", "apply loan", "credit score"],
    answer:
      "Visit the **Credit** page to view your credit score and apply for loans. Loan approval is based on your business activity and credit history.",
  },
  {
    keywords: ["what is mibuks", "about mibuks", "what does mibuks do"],
    answer:
      "**MiBuks** is a business management app designed for small businesses in Sierra Leone. It helps you track sales, expenses, inventory, customers, suppliers, invoices, and more — all in one place.",
  },
  {
    keywords: ["support", "help", "contact"],
    answer:
      "You can reach us at **support@mibuks.com**, call **+232 XX XXX XXXX**, or use the contact form on the Support page.",
  },
];

function findFaqAnswer(message: string): string | null {
  const lower = message.toLowerCase();
  let bestMatch: { answer: string; score: number } | null = null;

  for (const faq of FAQ) {
    let score = 0;
    for (const kw of faq.keywords) {
      if (lower.includes(kw)) score += kw.split(" ").length;
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { answer: faq.answer, score };
    }
  }

  return bestMatch && bestMatch.score >= 1 ? bestMatch.answer : null;
}

// ── System prompt for AI fallback ─────────────────────────────────────
const SYSTEM_PROMPT = `You are MiBuks Assistant, a friendly and helpful chatbot for the MiBuks business management app.
MiBuks helps small businesses in Sierra Leone manage sales, expenses, inventory, customers, suppliers, invoices, credit, loans, and team members.

Key features you should know about:
- Dashboard: Overview of revenue, sales, expenses, and profit with charts
- Sales: Record daily sales with multiple items and payment methods (cash, mobile money, credit)
- Expenses: Track business expenses by category
- Inventory: Manage products with stock levels, cost/selling prices, low-stock alerts
- Customers: Manage customers, set credit limits, track balances
- Suppliers: Track suppliers and outstanding payments
- Invoices: Create, send, and track invoices with PDF generation
- Credit: View credit scores and apply for business loans
- Reports: Revenue charts, expense breakdowns, profit summaries, PDF export
- Team Management: Invite members with role-based access control
- Branch Management: Multi-branch support with per-branch data filtering
- Security: PIN lock, biometric auth support
- Languages: English, Krio, French, Arabic
- Accessibility: Text-to-speech, font size controls

Contact: support@mibuks.com | +232 XX XXX XXXX

Rules:
- Be concise and helpful. Use markdown formatting.
- Only answer questions related to MiBuks. For unrelated questions, politely redirect.
- If unsure, suggest contacting support.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const lastMessage = messages?.[messages.length - 1]?.content || "";

    // 1) Try FAQ match first
    const faqAnswer = findFaqAnswer(lastMessage);
    if (faqAnswer) {
      // Return as a non-streaming JSON response with a flag
      return new Response(
        JSON.stringify({ faq: true, content: faqAnswer }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2) Fall back to Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({
          faq: true,
          content:
            "I'm sorry, the AI assistant is not available right now. Please try asking a simpler question or contact support at support@mibuks.com.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ faq: true, content: "I'm having trouble thinking right now. Please try again or contact support@mibuks.com." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-support error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
