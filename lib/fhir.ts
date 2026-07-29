// Display helpers for FHIR R4 resources.
//
// ClinikAPI accepts simplified JSON on write but returns real FHIR resources
// on read — these helpers turn the FHIR shapes into human-readable strings so
// the UI never renders "[object Object]". They are deliberately defensive:
// every field in FHIR is optional.

type Fhir = Record<string, any>;

export function humanName(resource: Fhir | undefined | null): string {
  const name = resource?.name?.[0];
  if (!name) return 'Unnamed';
  if (name.text) return name.text;
  const given = Array.isArray(name.given) ? name.given.join(' ') : '';
  return [given, name.family].filter(Boolean).join(' ') || 'Unnamed';
}

export function initials(resource: Fhir | undefined | null): string {
  const parts = humanName(resource).split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export function telecom(resource: Fhir | undefined | null, system: 'email' | 'phone'): string | null {
  const entry = resource?.telecom?.find((t: Fhir) => t.system === system);
  return entry?.value ?? null;
}

export function age(birthDate: string | undefined | null): string | null {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return years >= 0 ? `${years}y` : null;
}

export function codeText(concept: Fhir | string | undefined | null): string {
  if (!concept) return '—';
  if (typeof concept === 'string') return concept;
  return (
    concept.text ||
    concept.coding?.[0]?.display ||
    concept.coding?.[0]?.code ||
    '—'
  );
}

export function quantity(q: Fhir | undefined | null): string {
  if (!q || typeof q.value !== 'number') return '—';
  return `${q.value}${q.unit ? ` ${q.unit}` : ''}`;
}

/** Value of an Observation: quantity, string, coded, or multi-component. */
export function observationValue(obs: Fhir): string {
  if (obs.valueQuantity) return quantity(obs.valueQuantity);
  if (obs.valueString) return obs.valueString;
  if (obs.valueCodeableConcept) return codeText(obs.valueCodeableConcept);
  if (Array.isArray(obs.component) && obs.component.length > 0) {
    return obs.component
      .map((c: Fhir) => `${codeText(c.code)}: ${c.valueQuantity ? quantity(c.valueQuantity) : c.valueString ?? '—'}`)
      .join(' · ');
  }
  return '—';
}

export function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fmtDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Best-effort timestamp of a resource, for sorting mixed lists. */
export function resourceDate(r: Fhir): string {
  return (
    r.effectiveDateTime ||
    r.issued ||
    r.start ||
    r.authoredOn ||
    r.recordedDate ||
    r.date ||
    r.period?.start ||
    r.meta?.lastUpdated ||
    ''
  );
}

const STATUS_TONES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  final: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  booked: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  planned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  proposed: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  preliminary: 'bg-amber-50 text-amber-700 border-amber-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  'entered-in-error': 'bg-red-50 text-red-700 border-red-200',
  stopped: 'bg-red-50 text-red-700 border-red-200',
  noshow: 'bg-red-50 text-red-700 border-red-200',
};

export function statusTone(status: string | undefined | null): string {
  return STATUS_TONES[status ?? ''] ?? 'bg-slate-50 text-slate-600 border-slate-200';
}
