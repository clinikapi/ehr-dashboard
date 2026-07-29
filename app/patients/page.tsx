// Patients — server-rendered search + list. The search box submits a GET
// form, so the URL is shareable and the page needs zero client JS.
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Search01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';

import { clinik, isConfigured } from '@/lib/clinik';
import { age, humanName, initials, telecom } from '@/lib/fhir';
import { Card, EmptyState, PageHeader, SetupNotice } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

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
  const patients = res.data.data ?? [];

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={q ? `Search results for “${q}”` : 'Everyone registered in your datastore.'}
        action={
          <Link
            href="/patients/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white shadow-lg transition-colors hover:bg-slate-800"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} /> New patient
          </Link>
        }
      />

      <form method="GET" className="mb-6 flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search by name…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition-shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50">
          Search
        </button>
      </form>

      {patients.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title={q ? 'No patients match that search' : 'No patients yet'}
          hint={q ? 'Try a different name.' : 'Create your first patient to get started.'}
        />
      ) : (
        <Card className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Demographics</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.map((p: any) => (
                  <tr key={p.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/patients/${p.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-600">
                          {initials(p)}
                        </span>
                        <span className="text-sm font-bold group-hover:text-indigo-600">{humanName(p)}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium capitalize text-slate-500">
                      {[p.gender, age(p.birthDate)].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-500">
                      {telecom(p, 'email') ?? telecom(p, 'phone') ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{p.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
