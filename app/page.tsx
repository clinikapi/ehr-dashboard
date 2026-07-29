// Overview — server component. Everything on this page is fetched on the
// server through @clinikapi/sdk; no API key ever reaches the browser.
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, PlusSignIcon, TaskDaily01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';

import { clinik, isConfigured } from '@/lib/clinik';
import { age, fmtDateTime, humanName, initials } from '@/lib/fhir';
import { Card, EmptyState, PageHeader, SectionTitle, SetupNotice, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

async function loadOverview() {
  const c = clinik();
  const [patients, appointments] = await Promise.all([
    c.patients.search({ count: 8 }),
    c.appointments.search({ count: 8, sort: '-date' }),
  ]);
  return {
    patients: patients.data.data ?? [],
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
          <Link
            href="/patients/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white shadow-lg transition-colors hover:bg-slate-800"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} /> New patient
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4">
        {stats.map(({ label, value, icon, href }) => (
          <Link key={label} href={href}>
            <Card className="flex items-center justify-between transition-colors hover:border-indigo-200">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <HugeiconsIcon icon={icon} size={20} />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>Recent patients</SectionTitle>
          {patients.length === 0 ? (
            <EmptyState icon={UserGroupIcon} title="No patients yet" hint="Create your first patient to see them here." />
          ) : (
            <Card className="divide-y divide-slate-100 !p-0">
              {patients.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-600">
                    {initials(p)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{humanName(p)}</span>
                    <span className="block text-xs font-medium text-slate-400">
                      {[p.gender, age(p.birthDate)].filter(Boolean).join(' · ') || 'No demographics'}
                    </span>
                  </span>
                </Link>
              ))}
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
            <Card className="divide-y divide-slate-100 !p-0">
              {appointments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{a.description || 'Appointment'}</p>
                    <p className="text-xs font-medium text-slate-400">{fmtDateTime(a.start)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
