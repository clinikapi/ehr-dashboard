// Patient chart — the deepest SDK exercise in the app.
//
// The fetch lives in `lib/patients.ts` because it has to cope with HealthLake's
// eventually-consistent search index: the rich `_revinclude` bundle is a SEARCH
// and trails a write by ~10s, so a patient created a moment ago would 404 here.
// `getPatientChart` falls back to an immediate read-by-id and tells us the
// related resources aren't settled yet.
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
  codeText,
  fmtDate,
  fmtDateTime,
  normalizePatient,
  observationValue,
  resourceDate,
} from '@/lib/fhir';
import { getPatientChart } from '@/lib/patients';
import { AutoRefresh } from '@/components/auto-refresh';
import {
  IndexingNotice,
  PageHeader,
  SectionTitle,
  SetupNotice,
  StatusBadge,
} from '@/components/app-ui';
import { VitalsForm } from '@/components/vitals-form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function byDateDesc(a: any, b: any) {
  return resourceDate(b).localeCompare(resourceDate(a));
}

/** A titled card whose body is a list, with a consistent empty message. */
function ListCard({
  empty,
  children,
  isEmpty,
}: {
  empty: string;
  isEmpty: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      {isEmpty ? (
        <p className="px-5 py-6 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y">{children}</ul>
      )}
    </Card>
  );
}

export default async function PatientChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;

  if (!isConfigured()) {
    return (
      <>
        <PageHeader title="Patient chart" />
        <SetupNotice />
      </>
    );
  }

  const c = clinik();
  const [chart, conditionsRes, allergiesRes] = await Promise.all([
    getPatientChart(id),
    c.conditions.search({ patientId: id, count: 25 }).catch(() => null),
    c.allergies.search({ patientId: id, count: 25 }).catch(() => null),
  ]);

  // Only a genuinely missing patient reaches this — a lagging search index no
  // longer looks like a 404.
  if (!chart) notFound();

  const patient = normalizePatient(chart.patient);
  const observations = [...chart.observations].sort(byDateDesc);
  const appointments = [...chart.appointments].sort(byDateDesc);
  const prescriptions = [...chart.prescriptions].sort(byDateDesc);
  const labs = [...chart.labs].sort(byDateDesc);
  const notes = [...chart.notes].sort(byDateDesc);
  const encounters = [...chart.encounters].sort(byDateDesc);
  const conditions = conditionsRes?.data.data ?? [];
  const allergies = allergiesRes?.data.data ?? [];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground">
        <Link href={chart.indexing ? `/patients?new=${patient.id}` : '/patients'}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} /> All patients
        </Link>
      </Button>

      {chart.indexing && (
        <>
          <IndexingNotice>
            {isNew ? 'Patient created. ' : ''}
            The chart is live, but this record is still being indexed — appointments, vitals and
            documents appear here within a few seconds. No need to refresh.
          </IndexingNotice>
          <AutoRefresh />
        </>
      )}

      {/* Patient header */}
      <Card className="mb-6 sm:mb-8">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                {patient.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {patient.name}
              </h1>
              <p className="text-xs capitalize text-muted-foreground">
                {[
                  patient.gender,
                  patient.age,
                  patient.birthDate ? `b. ${fmtDate(patient.birthDate)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'No demographics recorded'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {patient.email && (
              <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
                <HugeiconsIcon icon={Mail01Icon} size={13} /> {patient.email}
              </Badge>
            )}
            {patient.phone && (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                {patient.phone}
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-[10px] font-normal text-muted-foreground">
              {patient.id}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 xl:grid-cols-3">
        {/* Left column: problems + allergies + encounters */}
        <div className="space-y-6 lg:space-y-8">
          <section>
            <SectionTitle>Problem list</SectionTitle>
            <ListCard isEmpty={conditions.length === 0} empty="No conditions recorded.">
              {conditions.map((cond: any) => (
                <li key={cond.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <HugeiconsIcon
                      icon={Stethoscope02Icon}
                      size={16}
                      className="shrink-0 text-primary"
                    />
                    <span className="truncate text-sm font-medium">{codeText(cond.code)}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtDate(cond.recordedDate)}
                  </span>
                </li>
              ))}
            </ListCard>
          </section>

          <section>
            <SectionTitle>Allergies</SectionTitle>
            <ListCard isEmpty={allergies.length === 0} empty="No known allergies.">
              {allergies.map((a: any) => (
                <li key={a.id} className="flex items-center gap-2.5 px-5 py-3">
                  <HugeiconsIcon
                    icon={AlertDiamondIcon}
                    size={16}
                    className="shrink-0 text-amber-500"
                  />
                  <span className="truncate text-sm font-medium">{codeText(a.code)}</span>
                  {a.criticality && (
                    <Badge variant="outline" className="ml-auto shrink-0 text-[10px] uppercase">
                      {a.criticality}
                    </Badge>
                  )}
                </li>
              ))}
            </ListCard>
          </section>

          <section>
            <SectionTitle>Encounters</SectionTitle>
            <ListCard isEmpty={encounters.length === 0} empty="No encounters recorded.">
              {encounters.slice(0, 6).map((e: any) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {codeText(e.type?.[0]) !== '—' ? codeText(e.type?.[0]) : 'Encounter'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDateTime(e.period?.start)}
                    </span>
                  </span>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ListCard>
          </section>
        </div>

        {/* Middle column: vitals */}
        <div className="space-y-6 lg:space-y-8">
          <section>
            <SectionTitle>Record vitals</SectionTitle>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <VitalsForm patientId={patient.id} />
              </CardContent>
            </Card>
          </section>

          <section>
            <SectionTitle>Observations</SectionTitle>
            <ListCard
              isEmpty={observations.length === 0}
              empty="No observations yet — record vitals above."
            >
              {observations.slice(0, 10).map((o: any) => (
                <li key={o.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <HugeiconsIcon icon={Pulse01Icon} size={16} className="shrink-0 text-rose-500" />
                      <span className="truncate text-sm font-medium">{codeText(o.code)}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmtDateTime(resourceDate(o))}
                    </span>
                  </div>
                  <p className="mt-1 pl-[26px] text-xs text-muted-foreground">
                    {observationValue(o)}
                  </p>
                </li>
              ))}
            </ListCard>
          </section>
        </div>

        {/* Right column: meds, labs, appointments, notes */}
        <div className="space-y-6 lg:col-span-2 lg:space-y-8 xl:col-span-1">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 xl:grid-cols-1">
            <section>
              <SectionTitle>Prescriptions</SectionTitle>
              <ListCard isEmpty={prescriptions.length === 0} empty="No prescriptions on file.">
                {prescriptions.slice(0, 6).map((rx: any) => (
                  <li key={rx.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <HugeiconsIcon
                        icon={MedicineBottle01Icon}
                        size={16}
                        className="shrink-0 text-emerald-600"
                      />
                      <span className="truncate text-sm font-medium">
                        {codeText(rx.medicationCodeableConcept) !== '—'
                          ? codeText(rx.medicationCodeableConcept)
                          : 'Medication'}
                      </span>
                    </span>
                    <StatusBadge status={rx.status} />
                  </li>
                ))}
              </ListCard>
            </section>

            <section>
              <SectionTitle>Lab reports</SectionTitle>
              <ListCard isEmpty={labs.length === 0} empty="No lab reports.">
                {labs.slice(0, 6).map((lab: any) => (
                  <li key={lab.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <HugeiconsIcon
                        icon={TestTube01Icon}
                        size={16}
                        className="shrink-0 text-violet-500"
                      />
                      <span className="truncate text-sm font-medium">{codeText(lab.code)}</span>
                    </span>
                    <StatusBadge status={lab.status} />
                  </li>
                ))}
              </ListCard>
            </section>

            <section>
              <SectionTitle>Appointments</SectionTitle>
              <ListCard isEmpty={appointments.length === 0} empty="No appointments.">
                {appointments.slice(0, 6).map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={16}
                        className="shrink-0 text-primary"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {a.description || 'Appointment'}
                        </span>
                        <span className="text-xs text-muted-foreground">{fmtDateTime(a.start)}</span>
                      </span>
                    </span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ListCard>
            </section>

            <section>
              <SectionTitle>Clinical notes</SectionTitle>
              <ListCard isEmpty={notes.length === 0} empty="No notes on file.">
                {notes.slice(0, 6).map((n: any) => (
                  <li key={n.id} className="flex items-center gap-2.5 px-5 py-3">
                    <HugeiconsIcon
                      icon={Note01Icon}
                      size={16}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {n.description || codeText(n.type) || 'Note'}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmtDateTime(n.date)}</span>
                    </span>
                  </li>
                ))}
              </ListCard>
            </section>
          </div>

          <section>
            <SectionTitle>Care summary</SectionTitle>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <HugeiconsIcon icon={HeartCheckIcon} size={20} className="shrink-0 text-rose-500" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {observations.length} observations · {prescriptions.length} prescriptions ·{' '}
                  {labs.length} lab reports · {appointments.length} appointments on record.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
