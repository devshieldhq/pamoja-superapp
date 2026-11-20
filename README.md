# Pamoja

**Your community. Your services. One WhatsApp conversation.**

Pamoja is a Kenya-first, community-powered super-app designed around a simple promise: people should be able to access useful local services through WhatsApp without downloading another app. A lightweight web experience supports discovery and richer views when needed.

## Product experience

- **WhatsApp-first access:** the WhatsApp backend includes a starter menu and replies for common commands.
- **Consent-based location:** users choose whether to share their location through WhatsApp's native location-sharing flow. Users can decline or type their area manually.
- **Local discovery:** browse sample businesses, search and filter by category.
- **Order requests:** select sample items and create a demo order request.
- **Ride requests:** enter pickup and destination and preview a ride request.
- **Wallet concept:** explore a demo balance and simulated activity.
- **Responsive web companion:** use the browser experience without installing a Pamoja app.

## Current integration status

The WhatsApp Cloud API backend code now supports:
- Meta GET webhook subscription verification.
- HMAC SHA-256 verification of incoming POST requests using the raw request body.
- A 1 MB request-body limit.
- Incoming text and shared-location message handling.
- A starter menu and replies for business discovery, orders, rides, wallet/M-Pesa and location instructions.
- Outbound text replies through the WhatsApp Cloud API when credentials are configured.
- Best-effort in-memory message de-duplication for retries.
- A health endpoint that reports whether required credentials are configured without exposing their values.

**This is backend code, not a live WhatsApp connection yet.** The Render web service still needs to be created and deployed, server-side secrets need to be configured, and Meta's webhook must be pointed to the service. In-memory de-duplication is temporary and resets when the process restarts; durable idempotency will be added with the database.

The first webhook version does not persist messages or coordinates. It does not yet query real merchants, create orders, book rides, or process payments. The replies clearly identify these features as not active.

The browser prototype still uses illustrative businesses and wallet activity. No real M-Pesa transactions, authentication, merchant order processing or driver dispatch are active yet.

## WhatsApp Cloud API setup

The Node.js webhook service is in `backend/whatsapp`.

1. Create a Render Web Service from this repository, branch `main`, runtime Node.
2. Set the build command to `npm install --prefix backend/whatsapp`.
3. Set the start command to `npm start --prefix backend/whatsapp`.
4. Add these environment variables in the Render service dashboard:
   - `WHATSAPP_VERIFY_TOKEN` — a strong random string you create and also enter in Meta's webhook configuration.
   - `WHATSAPP_APP_SECRET` — the Meta app secret, used to verify webhook signatures.
   - `WHATSAPP_ACCESS_TOKEN` — a server-side WhatsApp Cloud API access token.
   - `WHATSAPP_PHONE_NUMBER_ID` — the WhatsApp Business phone number ID.
   - `WHATSAPP_GRAPH_API_VERSION` — optional; defaults to `v27.0`.
5. Confirm the service health at `/health`.
6. Set the Meta callback URL to `https://<RENDER_SERVICE_HOST>/webhooks/whatsapp`, enter the same verify token, and subscribe to the `messages` webhook field.
7. Send a test message to the connected WhatsApp Business number and confirm the bot replies.

Meta app credentials and access tokens must remain server-side. Use a long-lived system-user token for production, with only the permissions required by the integration. Follow Meta's current onboarding and messaging policies.

## Run locally

The static frontend needs no build step. To run the WhatsApp backend locally, use Node.js 20 or newer:

```bash
cd backend/whatsapp
npm start
```

Set the WhatsApp environment variables before starting the backend. The frontend can be served separately with `python -m http.server 8000`.

## Backend roadmap

1. Deploy and test WhatsApp Cloud API end to end.
2. Integrate Safaricom Daraja with server-side credentials, STK Push and verified callbacks.
3. Create the separate Pamoja Supabase project, apply the schema, configure row-level security and authentication.
4. Connect durable webhook idempotency, merchant onboarding, catalogues, inventory and secure order lifecycle.
5. Build driver onboarding, consent-based trip location sharing, dispatch and trip status.
6. Add notifications, privacy controls, rate limits, audit logs and account deletion workflows.
7. Add automated tests, monitoring and production deployment configuration.

## Security and privacy principles

- Never expose API keys, access tokens, Supabase service-role keys or payment credentials in frontend code.
- Verify WhatsApp webhook signatures and payment callbacks server-side.
- Verify payment callbacks before marking an order as paid.
- Ask before accessing location; provide manual area entry and a no-location path.
- Request live location only when needed for an active ride and explain who can see it.
- Use HTTPS, authorization checks, row-level security, rate limits and audit trails.
- Do not log message contents, phone numbers, coordinates, access tokens or payment details.

## Tech

Vanilla HTML, CSS and JavaScript for the initial prototype. Node.js provides the first independently hosted WhatsApp webhook backend. Supabase will provide the database and authentication layer in a later phase.

---

Built for the community. Built together. **Pamoja.**
