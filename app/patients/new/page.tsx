import { PatientForm } from '@/components/patient-form';
import { Card, PageHeader, SetupNotice } from '@/components/ui';
import { isConfigured } from '@/lib/clinik';

export default function NewPatientPage() {
  if (!isConfigured()) {
    return (
      <>
        <PageHeader title="New patient" />
        <SetupNotice />
      </>
    );
  }
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New patient"
        subtitle="Simplified JSON in — the platform transforms it to a FHIR R4 Patient."
      />
      <Card>
        <PatientForm />
      </Card>
    </div>
  );
}
