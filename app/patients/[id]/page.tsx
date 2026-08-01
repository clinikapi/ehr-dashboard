// Patient chart — the deepest SDK exercise in the app.
//
// The fetch lives in `lib/patients.ts` because it has to cope with HealthLake's
// eventually-consistent search index: the rich `_revinclude` bundle is a SEARCH
// and trails a write by ~10s, so a patient created a moment ago would 404 here.
// `getPatientChart` falls back to an immediate read-by-id and tells us the
// related resources aren't settled yet.
//
// Every resource a gallery widget can write is surfaced here — if a widget
// records it, the chart shows it. Layout is mobile-first: one column on
// phones, two on tablets (md), three on desktop (xl), and every row is
// flex + min-w-0 so long clinical names truncate instead of overflowing.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertDiamondIcon,
  ArrowLeft01Icon,
  Calendar03Icon,
  ClipboardIcon,
  HeartCheckIcon,
  InjectionIcon,
  Mail01Icon,
  MedicineBottle01Icon,
  Note01Icon,
  Pulse01Icon,
  ShieldUserIcon,
  Stethoscope02Icon,
  Target02Icon,
  Task01Icon,
  TestTube01Icon,
} from '@hugeicons/core-free-icons';

import { isConfigured } from '@/lib/clinik';
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
        <p className="px-4 py-6 text-xs text-muted-foreground sm:px-5">{empty}</p>
      ) : (
        <ul className="divide-y">{children}</ul>
      )}
    </Card>
  );
}

/**
 * The one list-row layout every section uses: icon · title/subtitle · trailing
 * meta. Keeping it in one place is what keeps truncation consistent — the
 * min-w-0 chain is easy to drop when the row markup is copy-pasted.
 */
function ListRow({
  icon,
  iconClass,
  title,
  subtitle,
  trailing,
}: {
  icon: any;
  iconClass: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <span className="flex min-w-0 items-center gap-2.5">
        <HugeiconsIcon icon={icon} size={16} className={`shrink-0 ${iconClass}`} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{title}</span>
          {subtitle && (
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          )}
        </span>
      </span>
      {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
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

  const chart = await getPatientChart(id);

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
  const { conditions, allergies, immunizations, carePlans, goals, consents, intakes } = chart;

  const summaryCounts = [
    [observations.length, 'observations'],
    [prescriptions.length, 'prescriptions'],
    [labs.length, 'lab reports'],
    [appointments.length, 'appointments'],
    [immunizations.length, 'immunizations'],
    [carePlans.length, 'care plans'],
    [goals.length, 'goals'],
  ] as const;

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
      <Card className="mb-6 lg:mb-8">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 shrink-0 rounded-lg sm:h-14 sm:w-14">
              <AvatarFallback className="rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                {patient.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {patient.name}
              </h1>
              <p className="truncate text-xs capitalize text-muted-foreground">
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

          <div className="flex min-w-0 flex-wrap gap-2 text-xs">
            {patient.email && (
              <Badge
                variant="outline"
                className="max-w-full gap-1.5 font-normal text-muted-foreground"
              >
                <HugeiconsIcon icon={Mail01Icon} size={13} className="shrink-0" />
                <span className="truncate">{patient.email}</span>
              </Badge>
            )}
            {patient.phone && (
              <Badge variant="outline" className="max-w-full font-normal text-muted-foreground">
                <span className="truncate">{patient.phone}</span>
              </Badge>
            )}
            <Badge
              variant="outline"
              className="max-w-full font-mono text-[10px] font-normal text-muted-foreground"
            >
              <span className="truncate">{patient.id}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-3">
        {/* Column 1 — clinical status */}
        <div className="min-w-0 space-y-6 lg:space-y-8">
          <Section title="Problem list">
            <ListCard isEmpty={conditions.length === 0} empty="No conditions recorded.">
              {conditions.map((cond: any) => (
                <ListRow
                  key={cond.id}
                  icon={Stethoscope02Icon}
                  iconClass="text-primary"
                  title={codeText(cond.code)}
                  subtitle={cond.severity ? `Severity: ${cond.severity}` : undefined}
                  trailing={
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(cond.recordedDate ?? cond.onsetDateTime)}
                    </span>
                  }
                />
              ))}
            </ListCard>
          </Section>

          <Section title="Allergies">
            <ListCard isEmpty={allergies.length === 0} empty="No known allergies.">
              {allergies.map((a: any) => (
                <ListRow
                  key={a.id}
                  icon={AlertDiamondIcon}
                  iconClass="text-amber-500"
                  title={codeText(a.code)}
                  subtitle={
                    a.reaction?.[0]?.manifestation?.length
                      ? a.reaction[0].manifestation.map(codeText).join(', ')
                      : undefined
                  }
                  trailing={
                    a.criticality ? (
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {a.criticality}
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </ListCard>
          </Section>

          <Section title="Immunizations">
            <ListCard isEmpty={immunizations.length === 0} empty="No immunizations logged.">
              {immunizations.map((im: any) => (
                <ListRow
                  key={im.id}
                  icon={InjectionIcon}
                  iconClass="text-sky-500"
                  title={codeText(im.vaccineCode)}
                  subtitle={[im.site, im.lotNumber ? `Lot ${im.lotNumber}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                  trailing={
                    <>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {fmtDate(im.occurrenceDateTime)}
                      </span>
                      <StatusBadge status={im.status} />
                    </>
                  }
                />
              ))}
            </ListCard>
          </Section>

          <Section title="Encounters">
            <ListCard isEmpty={encounters.length === 0} empty="No encounters recorded.">
              {encounters.slice(0, 6).map((e: any) => (
                <ListRow
                  key={e.id}
                  icon={Stethoscope02Icon}
                  iconClass="text-muted-foreground"
                  title={codeText(e.type?.[0]) !== '—' ? codeText(e.type?.[0]) : 'Encounter'}
                  subtitle={fmtDateTime(e.period?.start)}
                  trailing={<StatusBadge status={e.status} />}
                />
              ))}
            </ListCard>
          </Section>
        </div>

        {/* Column 2 — measurements & plans */}
        <div className="min-w-0 space-y-6 lg:space-y-8">
          <Section title="Record vitals">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <VitalsForm patientId={patient.id} />
              </CardContent>
            </Card>
          </Section>

          <Section title="Observations">
            <ListCard
              isEmpty={observations.length === 0}
              empty="No observations yet — record vitals above."
            >
              {observations.slice(0, 8).map((o: any) => (
                <li key={o.id} className="px-4 py-3 sm:px-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <HugeiconsIcon
                        icon={Pulse01Icon}
                        size={16}
                        className="shrink-0 text-rose-500"
                      />
                      <span className="truncate text-sm font-medium">{codeText(o.code)}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmtDateTime(resourceDate(o))}
                    </span>
                  </div>
                  <p className="mt-1 break-words pl-[26px] text-xs text-muted-foreground">
                    {observationValue(o)}
                  </p>
                </li>
              ))}
            </ListCard>
          </Section>

          <Section title="Goals">
            <ListCard isEmpty={goals.length === 0} empty="No goals set.">
              {goals.map((g: any) => (
                <ListRow
                  key={g.id}
                  icon={Target02Icon}
                  iconClass="text-emerald-600"
                  title={g.description || 'Goal'}
                  subtitle={[
                    g.priority ? g.priority.replace('-priority', ' priority') : null,
                    g.target?.[0]?.dueDate ? `due ${fmtDate(g.target[0].dueDate)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  trailing={<StatusBadge status={g.lifecycleStatus} />}
                />
              ))}
            </ListCard>
          </Section>

          <Section title="Care plans">
            <ListCard isEmpty={carePlans.length === 0} empty="No care plans on file.">
              {carePlans.map((cp: any) => (
                <ListRow
                  key={cp.id}
                  icon={ClipboardIcon}
                  iconClass="text-indigo-500"
                  title={cp.title || 'Care plan'}
                  subtitle={cp.category?.length ? cp.category.join(', ') : cp.description}
                  trailing={<StatusBadge status={cp.status} />}
                />
              ))}
            </ListCard>
          </Section>
        </div>

        {/* Column 3 — orders, documents & admin */}
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 xl:grid-cols-1">
            <Section title="Prescriptions">
              <ListCard isEmpty={prescriptions.length === 0} empty="No prescriptions on file.">
                {prescriptions.slice(0, 6).map((rx: any) => (
                  <ListRow
                    key={rx.id}
                    icon={MedicineBottle01Icon}
                    iconClass="text-emerald-600"
                    title={
                      codeText(rx.medicationCodeableConcept ?? rx.medication) !== '—'
                        ? codeText(rx.medicationCodeableConcept ?? rx.medication)
                        : 'Medication'
                    }
                    subtitle={rx.dosageText}
                    trailing={<StatusBadge status={rx.status} />}
                  />
                ))}
              </ListCard>
            </Section>

            <Section title="Lab reports">
              <ListCard isEmpty={labs.length === 0} empty="No lab reports.">
                {labs.slice(0, 6).map((lab: any) => (
                  <ListRow
                    key={lab.id}
                    icon={TestTube01Icon}
                    iconClass="text-violet-500"
                    title={codeText(lab.code)}
                    trailing={<StatusBadge status={lab.status} />}
                  />
                ))}
              </ListCard>
            </Section>

            <Section title="Appointments">
              <ListCard isEmpty={appointments.length === 0} empty="No appointments.">
                {appointments.slice(0, 6).map((a: any) => (
                  <ListRow
                    key={a.id}
                    icon={Calendar03Icon}
                    iconClass="text-primary"
                    title={a.description || 'Appointment'}
                    subtitle={fmtDateTime(a.start)}
                    trailing={<StatusBadge status={a.status} />}
                  />
                ))}
              </ListCard>
            </Section>

            <Section title="Clinical notes">
              <ListCard isEmpty={notes.length === 0} empty="No notes on file.">
                {notes.slice(0, 6).map((n: any) => (
                  <ListRow
                    key={n.id}
                    icon={Note01Icon}
                    iconClass="text-muted-foreground"
                    title={n.description || codeText(n.type) || 'Note'}
                    subtitle={fmtDateTime(n.date)}
                  />
                ))}
              </ListCard>
            </Section>

            <Section title="Consents">
              <ListCard isEmpty={consents.length === 0} empty="No consents signed.">
                {consents.map((cs: any) => (
                  <ListRow
                    key={cs.id}
                    icon={ShieldUserIcon}
                    iconClass="text-teal-600"
                    title={cs.scopeDisplay || cs.scope || 'Consent'}
                    subtitle={[
                      Array.isArray(cs.category) ? cs.category.join(', ') : cs.category,
                      fmtDate(cs.dateTime),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    trailing={<StatusBadge status={cs.status} />}
                  />
                ))}
              </ListCard>
            </Section>

            <Section title="Intake responses">
              <ListCard isEmpty={intakes.length === 0} empty="No intake forms submitted.">
                {intakes.map((iq: any) => (
                  <ListRow
                    key={iq.id}
                    icon={Task01Icon}
                    iconClass="text-orange-500"
                    title={iq.items?.[0]?.text || 'Intake form'}
                    subtitle={[
                      iq.items?.[0]?.answers?.[0]?.valueString,
                      fmtDateTime(iq.authored),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    trailing={<StatusBadge status={iq.status} />}
                  />
                ))}
              </ListCard>
            </Section>

            <div className="md:col-span-2 xl:col-span-1">
              <Section title="Care summary">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                    <HugeiconsIcon
                      icon={HeartCheckIcon}
                      size={20}
                      className="shrink-0 text-rose-500"
                    />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {summaryCounts
                        .filter(([n]) => n > 0)
                        .map(([n, label]) => `${n} ${label}`)
                        .join(' · ') || 'Nothing on record yet.'}
                    </p>
                  </CardContent>
                </Card>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
