// Display helpers for ClinikAPI resources.
//
// ⚠️ Two shapes, one resource. ClinikAPI returns Patient in two different
// shapes depending on the endpoint, and code that assumes one shape silently
// renders blanks against the other:
//
//   • `patients.search()` and `patients.read(id)` (no includes) return the
//     SDK's FLATTENED projection — { id, firstName, lastName, email, phone,
//     gender, birthDate }. There is no `name[]` and no `telecom[]`.
//   • `patients.read(id, { include: [...] })` and the raw `/fhir/Patient/{id}`
//     passthrough return a genuine FHIR R4 Patient — `name[]`, `telecom[]`.
//
// Reading `resource.name[0]` therefore works on a chart page and yields
// "Unnamed" on every list. `normalizePatient()` below accepts EITHER shape and
// is the only thing the UI should use to display a patient.
//
// Every other helper is deliberately defensive too: in FHIR, every field is
// optional.

type Fhir = Record<string, any>;

/** Canonical, render-ready view of a patient — shape-agnostic. */
export interface PatientSummary {
  id: string;
  /** Display name, or `Unnamed patient` when the record genuinely has none. */
  name: string;
  /** False when the record carries no name at all (vs. one we failed to read). */
  hasName: boolean;
  initials: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  /** e.g. `34y` */
  age: string | null;
  /** e.g. `female · 34y`, or `—` when nothing is recorded. */
  demographics: string;
}

const UNNAMED = 'Unnamed patient';

/**
 * Accepts a FHIR Patient, the SDK's flattened patient, or null.
 *
 * Typed as `unknown` on purpose: the SDK declares `patients.search()` as
 * returning FHIR `Patient[]` but actually sends the flattened shape, so no
 * single declared type is honest here. Callers pass whatever they got.
 */
export function normalizePatient(resource: unknown): PatientSummary {
  const r = (resource ?? {}) as Fhir;

  // FHIR shape — name: [{ text?, given?: string[], family? }]
  const fhirName = Array.isArray(r.name) ? r.name[0] : undefined;
  const fromFhir = fhirName
    ? fhirName.text ||
      [Array.isArray(fhirName.given) ? fhirName.given.join(' ') : '', fhirName.family]
        .filter(Boolean)
        .join(' ')
    : '';

  // Flattened shape. `fullName` is the API's own display name (added so the
  // projection stops losing `name.text` and middle names); firstName/lastName
  // remain the fallback for records served by an older API build.
  const fromFlat =
    typeof r.fullName === 'string' && r.fullName
      ? r.fullName
      : typeof r.name === 'string'
        ? r.name
        : [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ');

  const name = (fromFhir || fromFlat).trim();

  const parts = name.split(/\s+/).filter(Boolean);
  const initials =
    parts
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase() ?? '')
      .join('') || '?';

  const gender = r.gender ?? null;
  const birthDate = r.birthDate ?? null;
  const years = age(birthDate);

  return {
    id: r.id ?? '',
    name: name || UNNAMED,
    hasName: Boolean(name),
    initials,
    email: telecom(r, 'email'),
    phone: telecom(r, 'phone'),
    gender,
    birthDate,
    age: years,
    demographics: [gender, years].filter(Boolean).join(' · ') || '—',
  };
}

/** Display name for either patient shape. Prefer `normalizePatient` in new code. */
export function humanName(resource: unknown): string {
  return normalizePatient(resource).name;
}

/** Up-to-two-letter initials for either patient shape. */
export function initials(resource: unknown): string {
  return normalizePatient(resource).initials;
}

/** Reads a contact point from either the FHIR `telecom[]` or the flat field. */
export function telecom(resource: unknown, system: 'email' | 'phone'): string | null {
  const r = (resource ?? {}) as Fhir;
  const entry = Array.isArray(r.telecom)
    ? r.telecom.find((t: Fhir) => t.system === system)
    : undefined;
  return entry?.value ?? r[system] ?? null;
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

/** Badge variant for a FHIR status code — consumed by `<StatusBadge>`. */
export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

const STATUS_TONES: Record<string, StatusTone> = {
  active: 'success',
  final: 'success',
  completed: 'success',
  fulfilled: 'success',
  booked: 'info',
  planned: 'info',
  arrived: 'info',
  proposed: 'warning',
  pending: 'warning',
  preliminary: 'warning',
  draft: 'warning',
  cancelled: 'danger',
  'entered-in-error': 'danger',
  stopped: 'danger',
  noshow: 'danger',
};

export function statusTone(status: string | undefined | null): StatusTone {
  return STATUS_TONES[status ?? ''] ?? 'neutral';
}
