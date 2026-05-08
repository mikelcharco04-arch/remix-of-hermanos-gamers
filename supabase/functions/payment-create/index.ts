import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS_PAYPAL: Record<string, { duration: string; amount: number; display: string }> = {
  day1: { duration: "1 día", amount: 4, display: "$4 USD" },
  day7: { duration: "7 días", amount: 7, display: "$7 USD" },
  day30: { duration: "30 días", amount: 15, display: "$15 USD" },
};
const PLANS_DIAMONDS: Record<string, { duration: string; amount: number; display: string }> = {
  day1: { duration: "1 día", amount: 500, display: "500 Diamantes" },
  day7: { duration: "7 días", amount: 800, display: "800 Diamantes" },
  day30: { duration: "30 días", amount: 1500, display: "1500 Diamantes" },
};

function rand(len: number) {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { plan, alias, email, payment_method } = await req.json();
    const method = payment_method === "diamonds" ? "diamonds" : "paypal";
    const table = method === "diamonds" ? PLANS_DIAMONDS : PLANS_PAYPAL;
    const p = table[plan];
    if (!p) throw new Error("Plan inválido");
    if (!alias || typeof alias !== "string" || alias.trim().length < 2) throw new Error("Alias requerido");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payment_id = `HG-${rand(8)}`;
    const tracking_token = `${rand(6)}-${rand(6)}-${rand(6)}-${rand(6)}`;

    const { data, error } = await supabase.from("payment_orders").insert({
      payment_id,
      tracking_token,
      alias: alias.trim().slice(0, 60),
      email: email?.trim().slice(0, 120) || null,
      plan,
      duration: p.duration,
      amount: p.amount,
      amount_display: p.display,
      payment_method: method,
      status: "AWAITING_RECEIPT",
    }).select().single();

    if (error) throw error;

    await supabase.from("payment_logs").insert({
      payment_id, event: "order_created",
      detail: { plan, method, amount: p.amount, alias: data.alias },
    });

    return new Response(JSON.stringify({
      payment_id: data.payment_id,
      tracking_token: data.tracking_token,
      amount: data.amount,
      amount_display: p.display,
      duration: data.duration,
      payment_method: method,
      paypal_url: method === "paypal" ? `https://www.paypal.me/ModifaxffLopez/${data.amount}` : null,
      diamonds_info: method === "diamonds" ? {
        ff_id: "6929427211",
        account: "suessa 7p",
        region: "Estados Unidos",
        amount: p.amount,
      } : null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
