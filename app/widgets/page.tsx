// Widget gallery — mounts all 14 @clinikapi/react components against the
// backend proxy. This is the reference for the proxyUrl integration pattern:
// widgets run in the browser with no credentials; the proxy holds the key.
import { clinik, isConfigured } from '@/lib/clinik';
import { normalizePatient } from '@/lib/fhir';
import { WidgetGallery } from '@/components/widget-gallery';
import { PageHeader, SetupNotice } from '@/components/app-ui';

export const dynamic = 'force-dynamic';

export default async function WidgetsPage() {
  if (!isConfigured()) {
    return (
      <>
        <PageHeader title="Widget gallery" />
        <SetupNotice />
      </>
    );
  }

  const res = await clinik().patients.search({ count: 50 });
  const patients = (res.data.data ?? []).map((p) => {
    const s = normalizePatient(p);
    return { id: s.id, label: s.name };
  });

  return (
    <>
      <PageHeader
        title="Widget gallery"
        subtitle="Every @clinikapi/react component, live against your datastore through the backend proxy."
      />
      <WidgetGallery patients={patients} />
    </>
  );
}
