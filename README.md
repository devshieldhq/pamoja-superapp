# Pamoja — Your World, Connected

**A WhatsApp-first super-app prototype for discovering local businesses, exploring services, planning rides and previewing payments.**

Pamoja is being built around a simple idea: people should be able to access useful local services through a familiar WhatsApp conversation, with a lightweight web companion for richer discovery and interaction.

The prototype starts with Kenya and is designed with international markets in mind. It is an early-stage demo, not a production marketplace or financial service.

## Try the prototype

- **Web prototype:** https://pamoja-superapp.onrender.com
- **WhatsApp webhook service:** https://pamoja-whatsapp.onrender.com
- **Source code:** https://github.com/devshieldhq/pamoja-superapp

The web frontend is hosted on Render as a static site and is configured to deploy from the `main` branch. The WhatsApp webhook is a separate Node.js Render web service.

## What you can try today

### Web prototype
- Browse sample local businesses.
- Search businesses and filter by category.
- Open a sample menu and submit an order request.
- Create a ride request preview with pickup, destination and ride type.
- Explore a demo wallet, add demo funds and simulate a transfer.
- Choose to share browser location or enter an area manually.
- Share Pamoja through WhatsApp.

**Demo data and persistence:** Orders, ride previews, wallet balance and demo transactions are stored in the browser's local storage on the device and browser where they were created. They are not synced to an account or backend and may not appear on another device or browser. Clearing browser data can remove them.

### WhatsApp integration
The Node.js service in `backend/whatsapp` contains:
- Meta GET webhook subscription verification.
- HMAC SHA-256 verification for incoming webhook POST requests.
- A 1 MB request-body limit.
- Incoming text and shared-location message handling.
- Starter menu replies for discovery, orders, rides, wallet and location instructions.
- Outbound text replies through the WhatsApp Cloud API when the required credentials are configured.
- Best-effort in-memory message de-duplication.
- A `/health` endpoint that reports credential configuration without returning secret values.

## What is not live yet

This project is a prototype. Please do not mistake sample data or simulated actions for completed services.

- Sample businesses and menus are illustrative, not live merchant listings.
- Web order requests are saved only in the current browser; no merchant receives or fulfils them.
- Ride requests are previews; no driver is contacted and no trip is booked.
- The wallet is simulated. No real funds are held, transferred or charged.
- M-Pesa / Daraja payments are not integrated.
- The WhatsApp bot's production phone-number onboarding is not complete. Meta business portfolio restrictions currently prevent adding a production number. The webhook service is deployed, but end-to-end WhatsApp messaging requires valid Meta credentials, webhook subscription and an eligible connected test or production number.
- Supabase authentication and database persistence are planned, not connected to this prototype.
- The international market selector is a presentation preview. It does not perform live currency conversion, localize merchant data or enable country-specific payment providers.

## Project architecture

```text
pamoja-superapp/
├── index.html                 # Web app structure
├── style.css                  # Responsive interface
├── app.js                     # Demo interactions and browser storage
├── international.js           # Market / currency presentation preview
└── backend/
    └── whatsapp/
        ├── server.js           # WhatsApp Cloud API webhook
        └── package.json
```

- **Frontend:** Vanilla HTML, CSS and JavaScript.
- **Hosting:** Render Static Site.
- **WhatsApp webhook:** Node.js on Render.
- **Planned data/auth layer:** Supabase.

## Run locally

### Web prototype

The frontend has no build step. From the repository root, run:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

Some browser capabilities, including geolocation, require a secure context such as HTTPS or localhost and user permission.

### WhatsApp webhook

Requires Node.js 20 or newer:

```bash
cd backend/whatsapp
npm install
npm start
```

The service listens on the port supplied by the hosting platform, or port 10000 by default.

## WhatsApp Cloud API configuration

Configure secrets as environment variables in the backend hosting dashboard. Do not commit them to Git or paste them into public issue reports.

Required variables:
- `WHATSAPP_VERIFY_TOKEN` — a strong value also entered in Meta's webhook configuration.
- `WHATSAPP_APP_SECRET` — used to validate webhook signatures.
- `WHATSAPP_ACCESS_TOKEN` — server-side Cloud API access token.
- `WHATSAPP_PHONE_NUMBER_ID` — the connected WhatsApp phone-number ID.

Optional:
- `WHATSAPP_GRAPH_API_VERSION` — Graph API version used by the service.

Webhook callback path:

```text
https://<YOUR_BACKEND_HOST>/webhooks/whatsapp
```

Subscribe the WhatsApp Business Account to the `messages` webhook field in Meta. Verify the callback using the same `WHATSAPP_VERIFY_TOKEN`. Test with an eligible Meta test number and an authorized recipient before attempting production onboarding.

Check service status at:

```text
https://<YOUR_BACKEND_HOST>/health
```

The health response indicates whether each credential is configured. It never returns credential values. A healthy endpoint alone does not prove that Meta can deliver events or that outbound messaging is authorized.

## Roadmap

1. Complete a reliable end-to-end WhatsApp test-number conversation.
2. Improve the demo so order and ride workflows have clear confirmation and status screens.
3. Create and connect the Pamoja Supabase project for accounts, merchant data and durable order records.
4. Build merchant onboarding, real catalogues, inventory and order fulfilment.
5. Integrate Safaricom Daraja in sandbox first, then production after required approvals and verification.
6. Build driver onboarding, dispatch, trip status and consent-based location sharing.
7. Add notifications, privacy controls, rate limits, audit logs, monitoring and account deletion workflows.
8. Add automated tests and prepare production deployment and compliance reviews.

## Security and privacy principles

- Keep API keys, access tokens, app secrets, database passwords and payment credentials on the server.
- Verify WhatsApp webhook signatures and payment callbacks server-side.
- Never mark an order paid until a payment callback has been authenticated and validated.
- Ask before accessing location and provide manual area entry or a no-location option.
- Request live location only when it is needed for an active service and explain how it will be used.
- Avoid logging message contents, phone numbers, coordinates, access tokens or payment details.
- Do not ask users for passwords, one-time codes or M-Pesa PINs.

## Contributing

Pamoja is an evolving prototype. Issues and contributions should distinguish working prototype behaviour from planned integrations. Never include credentials, personal data or private customer information in commits or issue reports.

---

**Pamoja — Your community. Your services. One connected experience.**
