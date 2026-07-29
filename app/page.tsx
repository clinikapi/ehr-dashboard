// Overview — server component. Everything on this page is fetched on the
// server through @clinikapi/sdk; no API key ever reaches the browser.
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, PlusSignIcon, TaskDaily01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';

import { clinik, isConfigured } from '@/lib/clinik';
import { fmtDateTime, normalizePatient } from '@/lib/fhir';
import { EmptyState, PageHeader, SectionTitle, SetupNotice, StatusBadge } from '@/components/app-ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function loadOverview() {
  const c = clinik();
  const [patients, appointments] = await Promise.all([
    c.patients.search({ count: 8 }),
    c.appointments.search({ count: 8, sort: '-date' }),
  ]);
  return {
    patients: (patients.data.data ?? []).map((p) => normalizePatient(p)),
    patientTotal: patients.data.total,
    appointments: appointments.data.data ?? [],
    appointmentTotal: appointments.data.total,
  };
}

export default async function OverviewPage() {
  if (!isConfigured()) {
    return (
      <>
        <PageHeader title="Overview" subtitle="Your clinic at a glance." />
        <SetupNotice />
      </>
    );
  }

  const { patients, patientTotal, appointments, appointmentTotal } = await loadOverview();

  const stats = [
    {
      label: 'Patients',
      value: patientTotal ?? `${patients.length}${patients.length >= 8 ? '+' : ''}`,
      icon: UserGroupIcon,
      href: '/patients',
    },
    {
      label: 'Appointments',
      value: appointmentTotal ?? `${appointments.length}${appointments.length >= 8 ? '+' : ''}`,
      icon: Calendar03Icon,
      href: '/appointments',
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Your clinic at a glance — live from the ClinikAPI FHIR datastore."
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/patients/new">
              <HugeiconsIcon icon={PlusSignIcon} size={16} /> New patient
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:mb-8 sm:grid-cols-2">
        {stats.map(({ label, value, icon, href }) => (
          <Link key={label} href={href} className="group">
            <Card className="transition-colors group-hover:border-primary/40">
              <CardContent className="flex items-center justify-between p-5 sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <HugeiconsIcon icon={icon} size={20} />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section>
          <SectionTitle>Recent patients</SectionTitle>
          {patients.length === 0 ? (
            <EmptyState
              icon={UserGroupIcon}
              title="No patients yet"
              hint="Create your first patient to see them here."
            />
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y">
                {patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/patients/${p.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        <span className="block truncate text-xs capitalize text-muted-foreground">
                          {p.demographics}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <section>
          <SectionTitle>Latest appointments</SectionTitle>
          {appointments.length === 0 ? (
            <EmptyState
              icon={TaskDaily01Icon}
              title="No appointments yet"
              hint="Book one from the Appointments page."
            />
          ) : (
            <Card className="overflow-hidden">
              <ul className="divide-y">
                {appointments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {a.description || 'Appointment'}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDateTime(a.start)}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
