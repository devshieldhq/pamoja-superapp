import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const encoder = new TextEncoder();
const GRAPH_VERSION = Deno.env.get("WHATSAPP_GRAPH_API_VERSION") ?? "v27.0";
const processedMessages = new Map<string, number>();
const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;

type WhatsAppMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
  location?: { latitude?: number; longitude?: number; name?: string; address?: string };
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function verifySignature(rawBody: string, signature: string, appSecret: string) {
  if (!signature.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody)),
  );
  const hex = [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return constantTimeEqual(signature.slice(7).toLowerCase(), hex);
}

function getMessageText(message: WhatsAppMessage): string {
  if (message.type === "text") return message.text?.body?.trim() ?? "";
  if (message.type === "button") return message.button?.payload ?? message.button?.text ?? "";
  if (message.type === "interactive") {
    return message.interactive?.button_reply?.id ??
      message.interactive?.list_reply?.id ??
      message.interactive?.button_reply?.title ??
      message.interactive?.list_reply?.title ?? "";
  }
  return "";
}

function menuText(): string {
  return [
    "Welcome to Pamoja 🇰🇪",
    "Your community. Your services. One WhatsApp conversation.",
    "",
    "What would you like to do?",
    "1️⃣ Find nearby businesses",
    "2️⃣ Explore products and orders",
    "3️⃣ Request a ride",
    "4️⃣ Wallet and M-Pesa",
    "5️⃣ Share my location",
    "Type MENU at any time to see these options.",
    "",
    "You stay in control. Share your location only when you choose.",
  ].join("\n");
}

function buildReply(message: WhatsAppMessage): string | null {
  if (message.type === "location" && message.location) {
    return [
      "Thanks for sharing your location with Pamoja 📍",
      "This first integration only receives it for this message; it does not save your coordinates.",
      "",
      "Nearby business discovery is being connected. Type MENU to explore the other options.",
    ].join("\n");
  }

  const input = getMessageText(message).toLowerCase().trim();
  if (!input) {
    if (message.type === "image" || message.type === "document" || message.type === "audio") {
      return "I can read text and shared location right now. Type MENU to see what Pamoja is preparing.";
    }
    return null;
  }

  if (["hi", "hello", "hey", "jambo", "habari", "start", "menu", "help"].includes(input)) {
    return menuText();
  }

  if (["5", "location", "share location", "my location"].includes(input)) {
    return [
      "To share your location, tap the 📎 attachment icon in this chat, choose Location, then Send your current location.",
      "Only share it if you're comfortable. You can also type your town or area instead.",
    ].join("\n");
  }

  if (["1", "shops", "businesses", "nearby", "find businesses"].includes(input)) {
    return "Local business discovery is being connected. Soon you'll be able to find nearby shops and services here. You can share your location voluntarily or type your area.\n\nType MENU to go back.";
  }

  if (["2", "order", "orders", "products", "buy"].includes(input)) {
    return "Product catalogues and order processing are being built. No order has been placed yet.\n\nType MENU to go back.";
  }

  if (["3", "ride", "taxi", "cab", "boda"].includes(input)) {
    return "Ride requests are being built. No driver has been contacted and no trip has been booked.\n\nType MENU to go back.";
  }

  if (["4", "wallet", "mpesa", "m-pesa", "pay"].includes(input)) {
    return "Pamoja wallet and M-Pesa payments are not active yet. Please don't send money or share your M-Pesa PIN here.\n\nType MENU to go back.";
  }

  if (["privacy", "data", "my data"].includes(input)) {
    return "Your privacy matters. This webhook does not store your messages or shared coordinates. Do not send passwords, PINs, or payment credentials. Persistent account and privacy controls will be added with the database integration.";
  }

  return "Sorry, I didn't catch that. Type MENU to see Pamoja options, or type LOCATION for instructions on sharing your location.";
}

function rememberMessage(messageId: string): boolean {
  const now = Date.now();
  for (const [id, timestamp] of processedMessages) {
    if (now - timestamp > DEDUPE_WINDOW_MS) processedMessages.delete(id);
  }
  if (processedMessages.has(messageId)) return false;
  processedMessages.set(messageId, now);
  if (processedMessages.size > 2000) {
    const oldest = processedMessages.keys().next().value;
    if (oldest) processedMessages.delete(oldest);
  }
  return true;
}

async function sendWhatsAppText(to: string, body: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId) {
    console.warn("WhatsApp reply skipped: outbound credentials are not configured.");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("WhatsApp send failed", {
        status: response.status,
        error: errorBody.slice(0, 500),
      });
    }
  } catch (error) {
    console.error("WhatsApp send request failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function handleWebhook(payload: Record<string, unknown>) {
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const changes = Array.isArray((entry as Record<string, unknown>).changes)
      ? (entry as Record<string, unknown>).changes as unknown[]
      : [];

    for (const change of changes) {
      if (!change || typeof change !== "object") continue;
      const value = (change as Record<string, unknown>).value;
      if (!value || typeof value !== "object") continue;
      const messages = Array.isArray((value as Record<string, unknown>).messages)
        ? (value as Record<string, unknown>).messages as WhatsAppMessage[]
        : [];

      for (const message of messages) {
        if (!message?.from || !message.id) continue;
        if (!rememberMessage(message.id)) continue;
        const reply = buildReply(message);
        if (reply) await sendWhatsAppText(message.from, reply);
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Meta webhook subscription verification.
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expected = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && expected && token === expected && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return json({ error: "Webhook verification failed" }, 403);
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!appSecret) return json({ error: "Webhook is not configured" }, 503);

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  if (!(await verifySignature(rawBody, signature, appSecret))) {
    return json({ error: "Invalid webhook signature" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (payload.object !== "whatsapp_business_account") {
    return json({ error: "Unsupported webhook object" }, 404);
  }

  // Only log event counts. Never log message bodies, phone numbers, coordinates,
  // access tokens, or payment data.
  const entries = Array.isArray(payload.entry) ? payload.entry.length : 0;
  console.info("Pamoja WhatsApp webhook received", { entries });

  await handleWebhook(payload);
  return json({ received: true });
});
