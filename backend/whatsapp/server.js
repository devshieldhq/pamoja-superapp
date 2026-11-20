import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 10000);
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v27.0";
const MAX_BODY_BYTES = 1024 * 1024;
const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;
const processedMessages = new Map();

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifySignature(rawBody, signature) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(signature.slice(7).toLowerCase(), expected);
}

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function menuText() {
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

function messageText(message) {
  if (message.type === "text") return message.text?.body?.trim() || "";
  if (message.type === "button") return message.button?.payload || message.button?.text || "";
  if (message.type === "interactive") {
    return message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.id ||
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title || "";
  }
  return "";
}

function buildReply(message) {
  if (message.type === "location" && message.location) {
    return [
      "Thanks for sharing your location with Pamoja 📍",
      "This first integration only receives it for this message; it does not save your coordinates.",
      "",
      "Nearby business discovery is being connected. Type MENU to explore the other options.",
    ].join("\n");
  }

  const input = messageText(message).toLowerCase().trim();
  if (!input) {
    if (["image", "document", "audio"].includes(message.type)) {
      return "I can read text and shared location right now. Type MENU to see what Pamoja is preparing.";
    }
    return null;
  }

  if (["hi", "hello", "hey", "jambo", "habari", "start", "menu", "help"].includes(input)) {
    return menuText();
  }
  if (["5", "location", "share location", "my location"].includes(input)) {
    return "To share your location, tap the 📎 attachment icon in this chat, choose Location, then Send your current location. Only share it if you're comfortable. You can also type your town or area instead.";
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

function rememberMessage(id) {
  const now = Date.now();
  for (const [key, timestamp] of processedMessages) {
    if (now - timestamp > DEDUPE_WINDOW_MS) processedMessages.delete(key);
  }
  if (processedMessages.has(id)) return false;
  processedMessages.set(id, now);
  if (processedMessages.size > 2000) {
    const oldest = processedMessages.keys().next().value;
    if (oldest) processedMessages.delete(oldest);
  }
  return true;
}

async function sendText(to, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.warn("WhatsApp reply skipped: outbound credentials are not configured.");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
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
      const errorText = await response.text();
      console.error("WhatsApp send failed", {
        status: response.status,
        error: errorText.slice(0, 400),
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

async function processWebhook(payload) {
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        if (!message.from || !message.id || !rememberMessage(message.id)) continue;
        const reply = buildReply(message);
        if (reply) await sendText(message.from, reply);
      }
    }
  }
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, {
      status: "ok",
      service: "pamoja-whatsapp",
      configured: {
        verifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
        appSecret: Boolean(process.env.WHATSAPP_APP_SECRET),
        accessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
        phoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      },
    });
  }

  if (url.pathname !== "/webhooks/whatsapp") {
    return sendJson(res, 404, { error: "Not found" });
  }

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expected = process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === "subscribe" && expected && token === expected && challenge) {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end(challenge);
    }
    return sendJson(res, 403, { error: "Webhook verification failed" });
  }

  if (req.method !== "POST") {
    res.setHeader("allow", "GET, POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  let rawBody;
  try {
    rawBody = await readBody(req);
  } catch (error) {
    return sendJson(res, error.message === "BODY_TOO_LARGE" ? 413 : 400, {
      error: error.message === "BODY_TOO_LARGE" ? "Payload too large" : "Invalid request",
    });
  }

  if (!verifySignature(rawBody, req.headers["x-hub-signature-256"])) {
    return sendJson(res, 401, { error: "Invalid webhook signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON" });
  }

  if (payload.object !== "whatsapp_business_account") {
    return sendJson(res, 404, { error: "Unsupported webhook object" });
  }

  const entryCount = Array.isArray(payload.entry) ? payload.entry.length : 0;
  console.info("Pamoja WhatsApp webhook received", { entries: entryCount });

  // Acknowledge Meta immediately. Message processing continues in this process.
  sendJson(res, 200, { received: true });
  void processWebhook(payload).catch((error) => {
    console.error("WhatsApp event processing failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.info("Pamoja WhatsApp service listening", { port: PORT });
});
