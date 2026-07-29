# ClinikCare EHR

> Mirrored from the ClinikAPI monorepo — contribute upstream; this repo is overwritten on every sync.

An open-source, responsive clinical EHR dashboard built on **[ClinikAPI](https://clinikapi.com)** — and the reference integration for the two official packages:

- **[`@clinikapi/sdk`](https://www.npmjs.com/package/@clinikapi/sdk)** — server-side client. Powers every page (patient registry, charts, vitals, scheduling) from React Server Components and Server Actions.
- **[`@clinikapi/react`](https://www.npmjs.com/package/@clinikapi/react)** — drop-in clinical widgets. The **Widget gallery** page mounts all 14 of them against a backend proxy.

You send simplified JSON; ClinikAPI stores standards-compliant FHIR R4. This app shows both directions: friendly writes, real FHIR reads rendered with defensive display helpers.

## Features

- **Overview** — live patient and appointment stats, recent activity
- **Patients** — searchable registry, registration form, and a full patient chart: problem list, allergies, vitals timeline, prescriptions, labs, encounters, appointments, and notes from a single `patients.read()` bundle
- **Vitals capture** — LOINC-coded blood pressure (multi-component), heart rate, temperature, and weight observations
- **Appointments** — schedule view + booking form
- **Widget gallery** — every `@clinikapi/react` component, live

## Architecture

```
Browser ──────────────┐
  Server Components   │  @clinikapi/sdk  ──────▶  api.clinikapi.com (FHIR R4)
  + Server Actions ───┘        ▲
                               │
  @clinikapi/react widgets ──▶ POST /api/clinikapi   (backend proxy)
  (no credentials in browser)   • action allowlist
                                • holds CLINIKAPI_KEY server-side
```

The security model is the one every ClinikAPI app should follow:

1. **The API key lives only on the server** (`lib/clinik.ts` imports `server-only`, so importing it from a client component is a build error).
2. **Browser code goes through one proxy route** (`app/api/clinikapi/route.ts`) with an explicit action **allowlist** — unknown actions are rejected, never passed through.
3. In a real deployment, authenticate your users in that proxy before forwarding anything. This demo has no user auth — run it with a **test** key.

## Quickstart

```bash
git clone https://github.com/clinikapi/ehr-dashboard
cd ehr-dashboard
npm install

cp .env.example .env.local
# → set CLINIKAPI_KEY=clk_test_...   (create one at https://dashboard.clinikapi.com)

npm run dev
```

Open http://localhost:3000, create a patient, record vitals, book an appointment, then explore the Widget gallery.

Test keys (`clk_test_`) write to ClinikAPI's sandbox datastore and are free on every plan — ideal for development. Swap in a live key only behind real authentication.

## Project structure

```
app/
  page.tsx                   # Overview (server component, SDK)
  patients/page.tsx          # Registry + search
  patients/new/page.tsx      # Registration (server action)
  patients/[id]/page.tsx     # Chart: patients.read() bundle + parallel searches
  appointments/page.tsx      # Schedule + booking
  widgets/page.tsx           # @clinikapi/react gallery
  api/clinikapi/route.ts     # THE proxy — allowlisted, key stays server-side
  actions.ts                 # Server actions ({ success, error? } results)
lib/
  clinik.ts                  # server-only SDK singleton
  fhir.ts                    # FHIR → human-readable display helpers
components/                  # shell, forms, gallery, UI primitives
```

## Deploy

`next.config.mjs` sets `output: 'standalone'`, so any Node host or a minimal Docker image works:

```bash
npm run build
node .next/standalone/server.js
```

Set `CLINIKAPI_KEY` (and optionally `CLINIKAPI_BASE_URL`) as **runtime** environment variables — they are read server-side per request, never baked into the client bundle.

## License

MIT — see [LICENSE](./LICENSE). Not a certified medical device; a reference implementation for the ClinikAPI developer platform.
