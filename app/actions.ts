'use server';

// Server actions — the app's own forms call the SDK directly on the server
// (no proxy hop needed; the proxy exists for browser-side widget code).
// Every action returns { success, error?, data? } so client forms can toast
// without try/catch, and revalidates the pages it changes.
import { revalidatePath } from 'next/cache';

import { clinik } from '@/lib/clinik';

type ActionResult<T = unknown> = { success: boolean; error?: string; data?: T };

function fail(err: unknown): ActionResult<never> {
  return { success: false, error: err instanceof Error ? err.message : 'Request failed' };
}

export async function createPatientAction(input: {
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  email?: string;
  phone?: string;
}): Promise<ActionResult<{ id: string }>> {
  if (!input.firstName?.trim() || !input.lastName?.trim()) {
    return { success: false, error: 'First and last name are required.' };
  }
  try {
    const res = await clinik().patients.create({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      gender: input.gender,
      birthDate: input.birthDate || undefined,
      email: input.email || undefined,
      phone: input.phone || undefined,
    });
    revalidatePath('/patients');
    revalidatePath('/');
    return { success: true, data: { id: (res.data as any).id } };
  } catch (err) {
    return fail(err);
  }
}

export async function createAppointmentAction(input: {
  patientId: string;
  start: string;
  minutesDuration: number;
  description?: string;
  appointmentType?: string;
}): Promise<ActionResult> {
  if (!input.patientId || !input.start) {
    return { success: false, error: 'Patient and start time are required.' };
  }
  try {
    const start = new Date(input.start);
    const end = new Date(start.getTime() + (input.minutesDuration || 30) * 60_000);
    await clinik().appointments.create({
      status: 'booked',
      patientId: input.patientId,
      start: start.toISOString(),
      end: end.toISOString(),
      minutesDuration: input.minutesDuration || 30,
      description: input.description || undefined,
      appointmentType: input.appointmentType || undefined,
    });
    revalidatePath('/appointments');
    revalidatePath(`/patients/${input.patientId}`);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return fail(err);
  }
}

export async function recordVitalsAction(input: {
  patientId: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  temperatureC?: number;
  weightKg?: number;
}): Promise<ActionResult> {
  if (!input.patientId) return { success: false, error: 'Patient is required.' };
  const c = clinik();
  const now = new Date().toISOString();
  try {
    const writes: Promise<unknown>[] = [];
    if (input.systolic && input.diastolic) {
      writes.push(
        c.observations.create({
          status: 'final',
          patientId: input.patientId,
          category: 'vital-signs',
          effectiveDateTime: now,
          code: { system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' },
          component: [
            { code: { system: 'http://loinc.org', code: '8480-6', display: 'Systolic' }, valueQuantity: { value: input.systolic, unit: 'mmHg' } },
            { code: { system: 'http://loinc.org', code: '8462-4', display: 'Diastolic' }, valueQuantity: { value: input.diastolic, unit: 'mmHg' } },
          ],
        }),
      );
    }
    if (input.heartRate) {
      writes.push(
        c.observations.create({
          status: 'final',
          patientId: input.patientId,
          category: 'vital-signs',
          effectiveDateTime: now,
          code: { system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' },
          valueQuantity: { value: input.heartRate, unit: 'beats/min' },
        }),
      );
    }
    if (input.temperatureC) {
      writes.push(
        c.observations.create({
          status: 'final',
          patientId: input.patientId,
          category: 'vital-signs',
          effectiveDateTime: now,
          code: { system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' },
          valueQuantity: { value: input.temperatureC, unit: '°C' },
        }),
      );
    }
    if (input.weightKg) {
      writes.push(
        c.observations.create({
          status: 'final',
          patientId: input.patientId,
          category: 'vital-signs',
          effectiveDateTime: now,
          code: { system: 'http://loinc.org', code: '29463-7', display: 'Body weight' },
          valueQuantity: { value: input.weightKg, unit: 'kg' },
        }),
      );
    }
    if (writes.length === 0) return { success: false, error: 'Enter at least one measurement.' };
    await Promise.all(writes);
    revalidatePath(`/patients/${input.patientId}`);
    return { success: true };
  } catch (err) {
    return fail(err);
  }
}
