import type { Metadata, Viewport } from 'next';

import { Shell } from '@/components/shell';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';

export const metadata: Metadata = {
  title: 'ClinikCare EHR — open-source clinical dashboard on ClinikAPI',
  description:
    'Reference clinical EHR dashboard built with @clinikapi/sdk and @clinikapi/react. Patients, charts, vitals, scheduling — all on the ClinikAPI FHIR platform.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider delayDuration={200}>
          <Shell>{children}</Shell>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
