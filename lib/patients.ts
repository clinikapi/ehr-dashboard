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
  conditions: any[];
  allergies: any[];
  immunizations: any[];
  carePlans: any[];
  goals: any[];
  consents: any[];
  intakes: any[];
  /**
   * True when the search index hadn't caught up and we served the patient from
   * a direct read — the related-resource lists are not authoritative yet.
   */
  indexing: boolean;
}

/**
 * Keep only rows that really belong to this patient.
 *
 * Defense-in-depth for two server-side search quirks: HealthLake appends an
 * OperationOutcome entry to warned searches (it surfaced here as a phantom
 * row with an empty id), and resource types without a `subject` search param
 * used to come back unfiltered — i.e. containing OTHER patients' rows.
 */
function forPatient(rows: unknown, patientId: string): any[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => r && r.id && r.patientId === patientId);
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

  const c = clinik();
  // The rich bundle plus one search per widget-writable resource, all in
  // parallel. Every search degrades to an empty list on failure — one flaky
  // resource must never blank the whole chart.
  const search = <T>(p: Promise<{ data: { data?: T[] } }>): Promise<T[] | null> =>
    p.then((r) => r.data.data ?? []).catch(() => null);

  const [bundle, conditions, allergies, immunizations, carePlans, goals, consents, intakes] =
    await Promise.all([
      c.patients.read(id, { include: [...CHART_INCLUDES] }).catch(() => null),
      search(c.conditions.search({ patientId: id, count: 50 })),
      search(c.allergies.search({ patientId: id, count: 50 })),
      search(c.immunizations.search({ patientId: id, count: 50 })),
      search(c.carePlans.search({ patientId: id, count: 50 })),
      search(c.goals.search({ patientId: id, count: 50 })),
      search(c.consents.search({ patientId: id, count: 50 })),
      search(c.intakes.search({ patientId: id, count: 50 })),
    ]);

  const searched = {
    conditions: forPatient(conditions, id),
    allergies: forPatient(allergies, id),
    immunizations: forPatient(immunizations, id),
    carePlans: forPatient(carePlans, id),
    goals: forPatient(goals, id),
    consents: forPatient(consents, id),
    intakes: forPatient(intakes, id),
  };

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
      ...searched,
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
    ...searched,
    indexing: true,
  };
}
