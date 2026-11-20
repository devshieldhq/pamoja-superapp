# Pamoja

**Your community. Your services. One WhatsApp conversation.**

Pamoja is a Kenya-first, community-powered super-app designed around a simple promise: people should be able to access useful local services through WhatsApp without downloading another app. A lightweight web experience supports discovery and richer views when needed.

## Product experience

- **WhatsApp-first access:** the intended primary journey starts with a WhatsApp message. The webhook now includes a starter menu and replies for common commands.
- **Consent-based location:** users choose whether to share their location through WhatsApp's native location-sharing flow. Users can decline or type their area manually.
- **Local discovery:** browse sample businesses, search and filter by category.
- **Order requests:** select sample items and create a demo order request.
- **Ride requests:** enter pickup and destination and preview a ride request.
- **Wallet concept:** explore a demo balance and simulated activity.
- **Responsive web companion:** use the browser experience without installing a Pamoja app.

## Current integration status

The WhatsApp webhook code now supports:
- Meta GET webhook subscription verification.
- HMAC SHA-256 verification of incoming POST requests using the raw request body.
- Incoming text and shared-location message handling.
- A starter menu and replies for business discovery, orders, rides, wallet/M-Pesa and location instructions.
- Outbound text replies through the WhatsApp Cloud API when credentials are configured.
- Best-effort in-memory message de-duplication for retries.

**This is backend code, not a live WhatsApp connection yet.** It must be deployed to a Supabase Edge Function and configured in Meta. The in-memory de-duplication is temporary and resets when the function instance restarts; durable idempotency will be added with the database.

The first webhook version does not persist messages or coordinates. It does not yet query real merchants, create orders, book rides, or process payments. The replies clearly identify these features as not active.

The browser prototype still uses illustrative businesses and wallet activity. No real M-Pesa transactions, authentication, merchant order processing or driver dispatch are active yet.

## WhatsApp Cloud API configuration

After the Pamoja Supabase project is available:

1. Deploy `supabase/functions/whatsapp-webhook`.
2. Configure these Edge Function secrets (never put them in frontend code):
   - `WHATSAPP_VERIFY_TOKEN` — a strong random string you create and also enter in Meta's webhook configuration.
   - `WHATSAPP_APP_SECRET` — the Meta app secret, used to verify webhook signatures.
   - `WHATSAPP_ACCESS_TOKEN` — a server-side WhatsApp Cloud API access token.
   - `WHATSAPP_PHONE_NUMBER_ID` — the WhatsApp Business phone number ID.
   - `WHATSAPP_GRAPH_API_VERSION` — optional; defaults to `v27.0`.
3. Set the Meta callback URL to `https://<PROJECT_REF>.supabase.co/functions/v1/whatsapp-webhook`.
4. Subscribe the WhatsApp Business Account to the `messages` webhook field.
5. Send a test message to the connected WhatsApp Business number and confirm the bot replies.

Meta app credentials and access tokens must remain server-side. Use a long-lived system-user token for production, with only the permissions required by the integration. Follow Meta's current onboarding and messaging policies.

## Run locally

No build step or package installation is required for the static frontend.

1. Clone this repository.
2. Open index.html in a browser, or serve the folder with a static web server.
3. For example: `python -m http.server 8000`
4. Visit `http://localhost:8000`.

## Backend roadmap

1. Finish WhatsApp Cloud API onboarding, deployment and end-to-end tests.
2. Integrate Safaricom Daraja with server-side credentials, STK Push and verified callbacks.
3. Create the separate Pamoja Supabase project, apply the schema, configure row-level security and authentication.
4. Build merchant onboarding, catalogues, inventory and secure order lifecycle.
5. Build driver onboarding, consent-based trip location sharing, dispatch and trip status.
6. Add durable webhook idempotency, notifications, privacy controls, rate limits, audit logs and account deletion workflows.
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

Vanilla HTML, CSS and JavaScript for the initial prototype. Supabase Edge Functions provide the first server-side integration foundation.

---

Built for the community. Built together. **Pamoja.**
