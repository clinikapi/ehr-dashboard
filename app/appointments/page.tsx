// Appointments — schedule list + booking form. The form's patient options are
// fetched server-side; the booking itself goes through a server action.
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';

import { clinik, isConfigured } from '@/lib/clinik';
import { fmtDateTime, normalizePatient } from '@/lib/fhir';
import { AppointmentForm } from '@/components/appointment-form';
import { EmptyState, PageHeader, SectionTitle, SetupNotice, StatusBadge } from '@/components/app-ui';
import { Card, CardContent } from '@/components/ui/card';

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
  const patients = (patientRes.data.data ?? []).map((p) => {
    const s = normalizePatient(p);
    return { id: s.id, label: s.name };
  });

  return (
    <>
      <PageHeader title="Appointments" subtitle="Book visits and review the schedule." />

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <section className="lg:col-span-2">
          <SectionTitle>Book an appointment</SectionTitle>
          <Card>
            <CardContent className="p-5 sm:p-6">
              <AppointmentForm patients={patients} />
            </CardContent>
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
            <Card className="overflow-hidden">
              <ul className="divide-y">
                {appointments.map((a: any) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:flex">
                        <HugeiconsIcon icon={Calendar03Icon} size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {a.description || 'Appointment'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
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
