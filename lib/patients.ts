// Consistency-aware patient reads.
//
// ⚠️ Read this before changing how the chart page fetches.
//
// ClinikAPI stores resources in AWS HealthLake, and HealthLake's SEARCH INDEX
// IS EVENTUALLY CONSISTENT — a resource you just created takes on the order of
// ten seconds to become findable by search. Reads by ID are immediate.
//
// That distinction is invisible from the SDK surface, which is what makes it
// bite: `patients.read(id, { include: [...] })` looks like a read-by-id, but
// `_revinclude` forces the gateway down a `GET /Patient?_id=…&_revinclude=…`
// SEARCH. So the obvious "create → redirect to /patients/{id}" flow 404s for
// ~10s and the user has to refresh by hand.
//
// The fix is to treat the two reads as what they are:
//   1. try the bundle search (rich — chart + related resources), then
//   2. fall back to a direct read-by-id, which is immediately consistent.
//
// A patient that exists therefore ALWAYS renders. When we land on the fallback
// we say so (`indexing: true`) rather than pretending the empty related-resource
// lists are the whole truth — the UI shows a notice and re-checks.
import 'server-only';

import { clinik } from '@/lib/clinik';

/** Resources pulled alongside the patient by the chart bundle. */
const CHART_INCLUDES = [
  'Appointment',
  'Observation',
  'DiagnosticReport',
  'MedicationRequest',
  'DocumentReference',
  'Encounter',
] as const;

export interface PatientChart {
  patient: Record<string, any>;
  observations: any[];
  appointments: any[];
  prescriptions: any[];
  labs: any[];
  notes: any[];
  encounters: any[];
  /**
   * True when the search index hadn't caught up and we served the patient from
   * a direct read — the related-resource lists are not authoritative yet.
   */
  indexing: boolean;
}

/**
 * FHIR ids are `[A-Za-z0-9-.]{1,64}` (R4 §Resource.id). The raw passthrough
 * takes the path verbatim, so validate before interpolating — never hand a
 * URL param straight to `fhir.request`.
 */
export function isValidFhirId(id: string): boolean {
  return /^[A-Za-z0-9\-.]{1,64}$/.test(id);
}

/**
 * Strongly consistent single-patient read (`GET /fhir/Patient/{id}`).
 * Returns a genuine FHIR Patient, or null if it doesn't exist.
 */
export async function readPatientById(id: string): Promise<Record<string, any> | null> {
  if (!isValidFhirId(id)) return null;
  try {
    const res = await clinik().fhir.request<Record<string, any>>('GET', `/Patient/${id}`);
    return res.data?.resourceType === 'Patient' ? res.data : null;
  } catch {
    // 404 (or any read failure) — the caller decides what that means.
    return null;
  }
}

/**
 * The chart page's fetch. Never returns a half-rendered page for a patient that
 * exists: falls back to the immediate read-by-id while search catches up.
 * Returns null only when the patient genuinely isn't there.
 */
export async function getPatientChart(id: string): Promise<PatientChart | null> {
  if (!isValidFhirId(id)) return null;

  const bundle = await clinik()
    .patients.read(id, { include: [...CHART_INCLUDES] })
    .catch(() => null);

  const fromBundle = bundle?.data;
  if (fromBundle?.patient) {
    return {
      patient: fromBundle.patient as Record<string, any>,
      observations: fromBundle.observations ?? [],
      appointments: fromBundle.appointments ?? [],
      prescriptions: fromBundle.prescriptions ?? [],
      labs: fromBundle.labs ?? [],
      notes: fromBundle.notes ?? [],
      encounters: fromBundle.encounters ?? [],
      indexing: false,
    };
  }

  const patient = await readPatientById(id);
  if (!patient) return null;

  return {
    patient,
    observations: [],
    appointments: [],
    prescriptions: [],
    labs: [],
    notes: [],
    encounters: [],
    indexing: true,
  };
}
