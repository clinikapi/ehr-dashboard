'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar03Icon,
  Cancel01Icon,
  DashboardSquare01Icon,
  Menu01Icon,
  Pulse01Icon,
  PuzzleIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';

const NAV = [
  { href: '/', label: 'Overview', icon: DashboardSquare01Icon },
  { href: '/patients', label: 'Patients', icon: UserGroupIcon },
  { href: '/appointments', label: 'Appointments', icon: Calendar03Icon },
  { href: '/widgets', label: 'Widget gallery', icon: PuzzleIcon },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map(({ href, label, icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <HugeiconsIcon icon={icon} size={17} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
        <HugeiconsIcon icon={Pulse01Icon} size={18} strokeWidth={2.5} />
      </span>
      <span>
        <span className="block text-sm font-black leading-tight tracking-tight">ClinikCare EHR</span>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Built on ClinikAPI
        </span>
      </span>
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:flex lg:flex-col lg:gap-8">
        <Brand />
        <NavLinks />
        <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-medium leading-relaxed text-slate-500">
          Open-source reference app for{' '}
          <a href="https://clinikapi.com" className="font-bold text-indigo-600 hover:underline">
            ClinikAPI
          </a>
          . Server pages use <code className="font-mono">@clinikapi/sdk</code>; the widget gallery
          uses <code className="font-mono">@clinikapi/react</code>.
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="rounded-xl border border-slate-200 p-2 text-slate-600"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-8 bg-white px-4 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-xl p-2 text-slate-500"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
