# Pamoja

**Your community. Your services. One WhatsApp conversation.**

Pamoja is a Kenya-first, community-powered super-app designed around a simple promise: people should be able to access useful local services through WhatsApp without downloading another app. A lightweight web experience supports discovery and richer views when needed.

## Product experience

- **WhatsApp-first access:** the intended primary journey starts with a WhatsApp message. The official bot becomes active after Meta WhatsApp Business Platform credentials, webhooks and a verified business number are connected.
- **Consent-based location:** ask before requesting location. WhatsApp users share it using WhatsApp's native location-sharing flow. Users can decline or type their area manually.
- **Local discovery:** browse sample businesses, search and filter by category.
- **Order requests:** select sample items and create a demo order request.
- **Ride requests:** enter pickup and destination and preview a ride request.
- **Wallet concept:** explore a demo balance and simulated activity.
- **WhatsApp sharing:** share an introduction through WhatsApp.
- **Responsive web companion:** use the browser experience without installing a Pamoja app.

## Current prototype status

This repository is a front-end prototype. WhatsApp buttons currently open WhatsApp with a prefilled message; they do not connect to a live Pamoja bot. Browser location access is requested only after the user clicks the location button, and the demo does not send or persist coordinates. WhatsApp location sharing will use the native WhatsApp flow after the bot asks the user to share their current location.

No real payments, M-Pesa transactions, authentication, merchant order processing, driver dispatch or live messaging are active yet. Sample businesses and wallet activity are illustrative.

## Run locally

No build step or package installation is required.

1. Clone this repository.
2. Open index.html in a browser, or serve the folder with a static web server.
3. For example: python -m http.server 8000
4. Visit http://localhost:8000.

## Backend roadmap

1. Create a separate Pamoja Supabase project, schema, row-level security and authentication.
2. Build merchant onboarding, catalogues, inventory and order lifecycle.
3. Connect WhatsApp Business Platform: inbound webhooks, message routing, interactive menus, location requests, status updates and opt-in controls.
4. Integrate Safaricom Daraja with server-side credentials, STK Push and verified callbacks.
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

## Tech

Vanilla HTML, CSS and JavaScript for the initial prototype. The architecture stays lightweight while the WhatsApp and backend foundations are built.

---

Built for the community. Built together. **Pamoja.**