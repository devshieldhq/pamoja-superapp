# Pamoja

**Everything you need. One less thing to juggle.**

Pamoja is a Kenya-first, community-powered super-app concept. It brings local business discovery, ordering, ride requests, wallet experiences and WhatsApp sharing into one simple interface.

## What is in this MVP?

- **Discover local businesses:** browse sample Kenyan businesses, filter by category and search.
- **Order requests:** select menu items and save a demo order request.
- **Ride request preview:** enter pickup and destination and preview a ride request.
- **Wallet concept:** explore a demo balance, add demo funds and simulate transfers.
- **WhatsApp sharing:** share the Pamoja demo with a WhatsApp contact or group.
- **Responsive interface:** desktop and mobile layouts.

## Run locally

No build step or package installation is required.

1. Clone this repository.
2. Open `index.html` in a browser, or serve the folder with any static web server.
3. For example: `python -m http.server 8000`
4. Visit `http://localhost:8000`.

## Important prototype limitations

This repository currently contains a front-end prototype. It does **not** process real payments, connect to M-Pesa, dispatch drivers, authenticate users, or send orders to merchants. Sample businesses and wallet activity are illustrative.

## Product roadmap

1. Establish backend, database schema and authentication.
2. Create merchant onboarding, catalogues, inventory and order lifecycle.
3. Integrate WhatsApp Business Platform webhooks and approved message templates.
4. Integrate Safaricom Daraja with secure server-side credentials, STK Push and verified callbacks.
5. Build driver onboarding, location sharing, dispatch and trip status.
6. Add notifications, moderation, privacy controls and audit logs.
7. Add tests, monitoring and production deployment configuration.

## Security principles

- Never expose API keys, access tokens or payment credentials in frontend code.
- Verify payment callbacks server-side before marking an order as paid.
- Collect only necessary personal data and provide clear consent.
- Use HTTPS, authorization checks, rate limits and audit trails.

## Tech

Vanilla HTML, CSS and JavaScript for the initial prototype. The architecture is intentionally lightweight so the experience can be tested before adding backend services.

---

Built for the community. Built together. **Pamoja.**