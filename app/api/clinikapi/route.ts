// ClinikAPI backend proxy — the ONLY path between the browser and ClinikAPI.
//
// The @clinikapi/react widgets POST { action, data } here (their `proxyUrl`
// prop). The secret API key stays on this server; the browser never sees it.
//
// Two rules make this safe to expose:
//   1. ALLOWLIST — only the actions the UI actually needs are mapped. An
//      unknown action is a 400, never a passthrough. Add actions explicitly.
//   2. In a real product, authenticate the caller here first (your session /
//      auth middleware) and scope what they may touch. This reference app has
//      no user auth, so deploy it only with a TEST key.
import { NextRequest, NextResponse } from 'next/server';

import { clinik, isConfigured } from '@/lib/clinik';

type Handler = (data: any) => Promise<{ data: unknown }>;

function actionMap(): Record<string, Handler> {
  const c = clinik();
  return {
    // ── PatientDashboard / app pages ─────────────────────────────
    'patients.create': (d) => c.patients.create(d),
    'patients.read': (d) => c.patients.read(d.id, { include: d.include }),
    'patients.update': (d) => c.patients.update(d.id, d.data ?? d),
    'patients.search': (d) => c.patients.search(d),
    // ── Scheduling ───────────────────────────────────────────────
    'appointments.create': (d) => c.appointments.create(d),
    // ── Clinical widgets ─────────────────────────────────────────
    'observations.create': (d) => c.observations.create(d),
    'labs.create': (d) => c.labs.create(d),
    'prescriptions.create': (d) => c.prescriptions.create(d),
    'notes.create': (d) => c.notes.create(d),
    'conditions.create': (d) => c.conditions.create(d),
    'allergies.create': (d) => c.allergies.create(d),
    'immunizations.create': (d) => c.immunizations.create(d),
    'goals.create': (d) => c.goals.create(d),
    'care-plans.create': (d) => c.carePlans.create(d),
    'intakes.submit': (d) => c.intakes.submit(d),
    'consents.sign': (d) => c.consents.sign(d),
  };
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'Not configured', message: 'Set CLINIKAPI_KEY on the server (see .env.example).' },
      { status: 503 },
    );
  }

  let body: { action?: string; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad request', message: 'Invalid JSON body.' }, { status: 400 });
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const handler = actionMap()[action];
  if (!handler) {
    return NextResponse.json(
      { error: 'Unknown action', message: `Action "${action}" is not allowed by this proxy.` },
      { status: 400 },
    );
  }

  try {
    const result = await handler(body.data ?? {});
    return NextResponse.json(result);
  } catch (err: unknown) {
    // SDK errors carry status + a PHI-sanitized message; pass those through
    // without leaking anything else.
    const status =
      typeof err === 'object' && err !== null && 'status' in err && typeof (err as any).status === 'number'
        ? (err as any).status
        : 500;
    const message = err instanceof Error ? err.message : 'Upstream request failed';
    return NextResponse.json({ error: 'ClinikAPI error', message }, { status });
  }
}
