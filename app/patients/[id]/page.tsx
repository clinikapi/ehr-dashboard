// Patient chart — the deepest SDK exercise in the app. One patients.read()
// with _revinclude pulls the patient plus their appointments, vitals, labs,
// prescriptions and notes as a destructured bundle; conditions and allergies
// (not part of the bundle shape) are fetched in parallel searches.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertDiamondIcon,
  ArrowLeft01Icon,
  Calendar03Icon,
  HeartCheckIcon,
  Mail01Icon,
  MedicineBottle01Icon,
  Note01Icon,
  Pulse01Icon,
  Stethoscope02Icon,
  TestTube01Icon,
} from '@hugeicons/core-free-icons';

import { clinik, isConfigured } from '@/lib/clinik';
import {
  age,
  codeText,
  fmtDate,
  fmtDateTime,
  humanName,
  initials,
  observationValue,
  resourceDate,
  telecom,
} from '@/lib/fhir';
import { Card, PageHeader, SectionTitle, SetupNotice, StatusBadge } from '@/components/ui';
import { VitalsForm } from '@/components/vitals-form';

export const dynamic = 'force-dynamic';

function byDateDesc(a: any, b: any) {
  return resourceDate(b).localeCompare(resourceDate(a));
}

export default async function PatientChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isConfigured()) {
    return (
      <>
        <PageHeader title="Patient chart" />
        <SetupNotice />
      </>
    );
  }

  const c = clinik();
  const [bundleRes, conditionsRes, allergiesRes] = await Promise.all([
    c.patients
      .read(id, {
        include: ['Appointment', 'Observation', 'DiagnosticReport', 'MedicationRequest', 'DocumentReference', 'Encounter'],
      })
      .catch(() => null),
    c.conditions.search({ patientId: id, count: 25 }).catch(() => null),
    c.allergies.search({ patientId: id, count: 25 }).catch(() => null),
  ]);

  const bundle = bundleRes?.data;
  if (!bundle?.patient) notFound();

  const patient = bundle.patient as any;
  const observations = [...bundle.observations].sort(byDateDesc);
  const appointments = [...bundle.appointments].sort(byDateDesc);
  const prescriptions = [...bundle.prescriptions].sort(byDateDesc);
  const labs = [...bundle.labs].sort(byDateDesc);
  const notes = [...bundle.notes].sort(byDateDesc);
  const encounters = [...bundle.encounters].sort(byDateDesc);
  const conditions = conditionsRes?.data.data ?? [];
  const allergies = allergiesRes?.data.data ?? [];

  const email = telecom(patient, 'email');
  const phone = telecom(patient, 'phone');

  return (
    <>
      <Link
        href="/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-black text-slate-400 transition-colors hover:text-slate-600"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} /> All patients
      </Link>

      {/* Patient header */}
      <Card className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white">
              {initials(patient)}
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">{humanName(patient)}</h1>
              <p className="text-xs font-bold capitalize text-slate-400">
                {[patient.gender, age(patient.birthDate), patient.birthDate ? `b. ${fmtDate(patient.birthDate)}` : null]
                  .filter(Boolean)
                  .join(' · ') || 'No demographics recorded'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            {email && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                <HugeiconsIcon icon={Mail01Icon} size={13} /> {email}
              </span>
            )}
            {phone && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                {phone}
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[10px] text-slate-400">
              {patient.id}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left column: problems + allergies + encounters */}
        <div className="space-y-8">
          <section>
            <SectionTitle>Problem list</SectionTitle>
            <Card className="!p-0">
              {conditions.length === 0 ? (
                <p className="px-5 py-6 text-xs font-medium text-slate-400">No conditions recorded.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {conditions.map((cond: any) => (
                    <li key={cond.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <HugeiconsIcon icon={Stethoscope02Icon} size={16} className="shrink-0 text-indigo-500" />
                        <span className="truncate text-sm font-bold">{codeText(cond.code)}</span>
                      </span>
                      <span className="shrink-0 text-[11px] font-bold text-slate-400">{fmtDate(cond.recordedDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Allergies</SectionTitle>
            <Card className="!p-0">
              {allergies.length === 0 ? (
                <p className="px-5 py-6 text-xs font-medium text-slate-400">No known allergies.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {allergies.map((a: any) => (
                    <li key={a.id} className="flex items-center gap-2.5 px-5 py-3">
                      <HugeiconsIcon icon={AlertDiamondIcon} size={16} className="shrink-0 text-amber-500" />
                      <span className="truncate text-sm font-bold">{codeText(a.code)}</span>
                      {a.criticality && (
                        <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                          {a.criticality}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Encounters</SectionTitle>
            <Card className="!p-0">
              {encounters.length === 0 ? (
                <p className="px-5 py-6 text-xs font-medium text-slate-400">No encounters recorded.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {encounters.slice(0, 6).map((e: any) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{codeText(e.type?.[0]) !== '—' ? codeText(e.type?.[0]) : 'Encounter'}</span>
                        <span className="text-[11px] font-medium text-slate-400">{fmtDateTime(e.period?.start)}</span>
                      </span>
                      <StatusBadge status={e.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>

        {/* Middle column: vitals */}
        <div className="space-y-8">
          <section>
            <SectionTitle>Record vitals</SectionTitle>
            <Card>
              <VitalsForm patientId={patient.id} />
            </Card>
          </section>

          <section>
            <SectionTitle>Observations</SectionTitle>
            <Card className="!p-0">
              {observations.length === 0 ? (
                <p className="px-5 py-6 text-xs font-medium text-slate-400">
                  No observations yet — record vitals above.
                </p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {observations.slice(0, 10).map((o: any) => (
                    <li key={o.id} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <HugeiconsIcon icon={Pulse01Icon} size={16} className="shrink-0 text-rose-500" />
                          <span className="truncate text-sm font-bold">{codeText(o.code)}</span>
                        </span>
                        <span className="shrink-0 text-[11px] font-bold text-slate-400">
                          {fmtDateTime(resourceDate(o))}
                        </span>
                      </div>
                      <p className="mt-1 pl-[26px] text-xs font-medium text-slate-500">{observationValue(o)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>

        {/* Right column: meds, labs, appointments, notes */}
        <div className="space-y-8">
          <section>
            <SectionTitle>Prescriptions</SectionTitle>
            <Card className="!p-0">
              {prescriptions.length === 0 ? (
                <p className="px-5 py-6 text-xs font-medium text-slate-400">No prescriptions on file.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {prescriptions.slice(0, 6).map((rx: any) => (
                    <li key={rx.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <HugeiconsIcon icon={MedicineBottle01Icon} size={16} className="shrink-0 text-emerald-600" />
                        <span className="truncate text-sm font-bold">
                          {codeText(rx.medicationCodeableConcept) !== '—'
                            ? codeText(rx.medicationCodeableConcept)
                            : 'Medication'}
                        </span>
                      </span>
                      <StatusBadge status={rx.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Lab reports</SectionTitle>
            <Card className="!p-0">
              {labs.length === 0 ? (
                <p className="px-5 py-6 text-xs font-medium text-slate-400">No lab reports.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {labs.slice(0, 6).map((lab: any) => (
                    <li key={lab.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <HugeiconsIcon icon={TestTube01Icon} size={16} className="shrink-0 text-violet-500" />
                        <span className="truncate text-sm font-bold">{codeText(lab.code)}</span>
                      </span>
                      <StatusBadge status={lab.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Appointments</SectionTitle>
            <Card className="!p-0">
              {appointments.length === 0 ? (
                <p className="px-5 py-6 text-xs font-medium text-slate-400">No appointments.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {appointments.slice(0, 6).map((a: any) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <HugeiconsIcon icon={Calendar03Icon} size={16} className="shrink-0 text-indigo-500" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{a.description || 'Appointment'}</span>
                          <span className="text-[11px] font-medium text-slate-400">{fmtDateTime(a.start)}</span>
                        </span>
                      </span>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Clinical notes</SectionTitle>
            <Card className="!p-0">
              {notes.length === 0 ? (
                <p className="px-5 py-6 text-xs font-medium text-slate-400">No notes on file.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {notes.slice(0, 6).map((n: any) => (
                    <li key={n.id} className="flex items-center gap-2.5 px-5 py-3">
                      <HugeiconsIcon icon={Note01Icon} size={16} className="shrink-0 text-slate-400" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">
                          {n.description || codeText(n.type) || 'Note'}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">{fmtDateTime(n.date)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section>
            <SectionTitle>Care summary</SectionTitle>
            <Card className="flex items-center gap-3">
              <HugeiconsIcon icon={HeartCheckIcon} size={20} className="shrink-0 text-rose-500" />
              <p className="text-xs font-medium leading-relaxed text-slate-500">
                {observations.length} observations · {prescriptions.length} prescriptions · {labs.length} lab
                reports · {appointments.length} appointments on record.
              </p>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
