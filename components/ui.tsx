// Small server-component-safe UI primitives shared across pages.
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Key01Icon } from '@hugeicons/core-free-icons';

import { statusTone } from '@/lib/fhir';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-400">{children}</h2>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold capitalize ${statusTone(status)}`}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: IconSvgElement;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        <HugeiconsIcon icon={icon} size={24} />
      </span>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {hint && <p className="max-w-xs text-xs font-medium text-slate-400">{hint}</p>}
    </div>
  );
}

/** Shown on every page when CLINIKAPI_KEY is missing — the app still renders. */
export function SetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <HugeiconsIcon icon={Key01Icon} size={20} />
        </span>
        <div className="space-y-2 text-sm">
          <p className="font-black text-amber-900">Connect your ClinikAPI key to load live data</p>
          <ol className="list-decimal space-y-1 pl-4 font-medium text-amber-800">
            <li>
              Create a <span className="font-bold">test</span> API key at{' '}
              <a href="https://dashboard.clinikapi.com" className="font-bold underline">
                dashboard.clinikapi.com
              </a>
            </li>
            <li>
              Copy <code className="rounded bg-amber-100 px-1 font-mono">.env.example</code> to{' '}
              <code className="rounded bg-amber-100 px-1 font-mono">.env.local</code> and set{' '}
              <code className="rounded bg-amber-100 px-1 font-mono">CLINIKAPI_KEY</code>
            </li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
