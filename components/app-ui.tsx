// App-level presentational pieces.
//
// Distinct from `components/ui/*`, which holds the unmodified shadcn/ui
// primitives. Anything in here is specific to how ClinikCare composes them —
// page headers, section labels, the FHIR status badge, empty states.
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Key01Icon } from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils';
import { statusTone, type StatusTone } from '@/lib/fhir';
import { Badge } from '@/components/ui/badge';

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
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-border bg-muted text-muted-foreground',
};

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return null;
  return (
    <Badge
      variant="outline"
      className={cn('shrink-0 capitalize', TONE_CLASSES[statusTone(status)], className)}
    >
      {status}
    </Badge>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: IconSvgElement;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-card px-6 py-10 text-center sm:py-14">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <HugeiconsIcon icon={icon} size={24} />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Shown on every page when CLINIKAPI_KEY is missing — the app still renders. */
export function SetupNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <HugeiconsIcon icon={Key01Icon} size={20} />
        </span>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-amber-900">Connect your ClinikAPI key to load live data</p>
          <ol className="list-decimal space-y-1 pl-4 text-amber-800">
            <li>
              Create a <span className="font-semibold">test</span> API key at{' '}
              <a href="https://dashboard.clinikapi.com" className="font-semibold underline">
                dashboard.clinikapi.com
              </a>
            </li>
            <li>
              Copy <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.example</code> to{' '}
              <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.local</code> and set{' '}
              <code className="rounded bg-amber-100 px-1 font-mono text-xs">CLINIKAPI_KEY</code>
            </li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown while HealthLake's search index catches up with a just-written record.
 * Pair it with `<AutoRefresh />` so the page resolves itself.
 */
export function IndexingNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-indigo-500"
      />
      <p className="text-xs text-indigo-900 sm:text-sm">{children}</p>
    </div>
  );
}
