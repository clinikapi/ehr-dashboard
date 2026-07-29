// Appointments — schedule list + booking form. The form's patient options are
// fetched server-side; the booking itself goes through a server action.
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';

import { clinik, isConfigured } from '@/lib/clinik';
import { fmtDateTime, humanName } from '@/lib/fhir';
import { AppointmentForm } from '@/components/appointment-form';
import { Card, EmptyState, PageHeader, SectionTitle, SetupNotice, StatusBadge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
  if (!isConfigured()) {
    return (
      <>
        <PageHeader title="Appointments" />
        <SetupNotice />
      </>
    );
  }

  const c = clinik();
  const [apptRes, patientRes] = await Promise.all([
    c.appointments.search({ count: 25, sort: '-date' }),
    c.patients.search({ count: 100 }),
  ]);
  const appointments = apptRes.data.data ?? [];
  const patients = (patientRes.data.data ?? []).map((p: any) => ({
    id: p.id as string,
    label: humanName(p),
  }));

  return (
    <>
      <PageHeader title="Appointments" subtitle="Book visits and review the schedule." />

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <SectionTitle>Book an appointment</SectionTitle>
          <Card>
            <AppointmentForm patients={patients} />
          </Card>
        </section>

        <section className="lg:col-span-3">
          <SectionTitle>Schedule</SectionTitle>
          {appointments.length === 0 ? (
            <EmptyState
              icon={Calendar03Icon}
              title="Nothing scheduled"
              hint="Book the first appointment with the form."
            />
          ) : (
            <Card className="!p-0">
              <ul className="divide-y divide-slate-50">
                {appointments.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <HugeiconsIcon icon={Calendar03Icon} size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{a.description || 'Appointment'}</p>
                        <p className="text-xs font-medium text-slate-400">
                          {fmtDateTime(a.start)}
                          {a.minutesDuration ? ` · ${a.minutesDuration} min` : ''}
                          {a.appointmentType?.text ? ` · ${a.appointmentType.text}` : ''}
                        </p>
                      </div>
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
