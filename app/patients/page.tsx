// Patients — server-rendered search + list. The search box submits a GET
// form, so the URL is shareable and the page needs zero client JS.
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Search01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';

import { clinik, isConfigured } from '@/lib/clinik';
import { normalizePatient, type PatientSummary } from '@/lib/fhir';
import { readPatientById } from '@/lib/patients';
import { AutoRefresh } from '@/components/auto-refresh';
import { EmptyState, IndexingNotice, PageHeader, SetupNotice } from '@/components/app-ui';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

type Row = PatientSummary & { pending?: boolean };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; new?: string }>;
}) {
  const { q, new: newId } = await searchParams;

  if (!isConfigured()) {
    return (
      <>
        <PageHeader title="Patients" />
        <SetupNotice />
      </>
    );
  }

  const res = await clinik().patients.search({
    count: 25,
    ...(q ? { name: q } : {}),
  });

  const rows: Row[] = (res.data.data ?? []).map((p) =>
    normalizePatient(p),
  );

  // A patient created seconds ago is readable by id but not yet findable by
  // search (HealthLake index lag — see lib/patients.ts). Rather than let the
  // list look like the record was lost, fetch it directly and mark it pending.
  let pendingRow: Row | null = null;
  if (newId && !rows.some((r) => r.id === newId)) {
    const fresh = await readPatientById(newId);
    if (fresh) pendingRow = { ...normalizePatient(fresh), pending: true };
  }

  const patients: Row[] = pendingRow ? [pendingRow, ...rows] : rows;

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={q ? `Search results for “${q}”` : 'Everyone registered in your datastore.'}
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/patients/new">
              <HugeiconsIcon icon={PlusSignIcon} size={16} /> New patient
            </Link>
          </Button>
        }
      />

      <form method="GET" className="mb-6 flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search by name…"
            aria-label="Search patients by name"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {pendingRow && (
        <>
          <IndexingNotice>
            <strong className="font-semibold">{pendingRow.name}</strong> was just created. It takes a
            few seconds to appear in search results — this list is refreshing itself.
          </IndexingNotice>
          <AutoRefresh />
        </>
      )}

      {patients.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title={q ? 'No patients match that search' : 'No patients yet'}
          hint={q ? 'Try a different name.' : 'Create your first patient to get started.'}
          action={
            !q && (
              <Button asChild size="sm">
                <Link href="/patients/new">New patient</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Mobile: stacked cards — a 4-column table can't be read at 375px. */}
          <div className="space-y-3 md:hidden">
            {patients.map((p) => (
              <Card key={p.id} className="p-4">
                <Link href={`/patients/${p.id}`} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                      {p.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{p.name}</span>
                      {p.pending && (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          Indexing
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs capitalize text-muted-foreground">
                      {p.demographics}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.email ?? p.phone ?? '—'}
                    </p>
                  </div>
                </Link>
              </Card>
            ))}
          </div>

          {/* Desktop */}
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Patient</TableHead>
                  <TableHead>Demographics</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id} className="group">
                    <TableCell className="py-3">
                      <Link href={`/patients/${p.id}`} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                            {p.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold group-hover:text-primary">{p.name}</span>
                        {p.pending && (
                          <Badge variant="outline" className="text-[10px]">
                            Indexing
                          </Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {p.demographics}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.email ?? p.phone ?? '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {p.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </>
  );
}
