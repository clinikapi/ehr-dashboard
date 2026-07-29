'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar03Icon,
  DashboardSquare01Icon,
  Menu01Icon,
  Pulse01Icon,
  PuzzleIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
            aria-current={active ? 'page' : undefined}
            className={cn(
              // 44px min touch target
              'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <HugeiconsIcon icon={icon} size={18} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <HugeiconsIcon icon={Pulse01Icon} size={18} strokeWidth={2.5} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold leading-tight tracking-tight">
          ClinikCare EHR
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Built on ClinikAPI
        </span>
      </span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="rounded-md border bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
      Open-source reference app for{' '}
      <a href="https://clinikapi.com" className="font-semibold text-primary hover:underline">
        ClinikAPI
      </a>
      . Server pages use <code className="font-mono">@clinikapi/sdk</code>; the widget gallery uses{' '}
      <code className="font-mono">@clinikapi/react</code>.
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation — otherwise it stays open behind the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r bg-card px-4 py-6 lg:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto">
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobile header + drawer */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
        <Brand />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation">
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[280px] flex-col gap-8">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Move between the ClinikCare sections.
            </SheetDescription>
            <Brand onNavigate={() => setOpen(false)} />
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto">
              <SidebarFooter />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
