import type { Metadata } from 'next';

import { Shell } from '@/components/shell';

import './globals.css';

export const metadata: Metadata = {
  title: 'ClinikCare EHR — open-source clinical dashboard on ClinikAPI',
  description:
    'Reference clinical EHR dashboard built with @clinikapi/sdk and @clinikapi/react. Patients, charts, vitals, scheduling — all on the ClinikAPI FHIR platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
