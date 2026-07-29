import { PatientForm } from '@/components/patient-form';
import { PageHeader, SetupNotice } from '@/components/app-ui';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New patient" subtitle="Register someone in your FHIR datastore." />
      <Card>
        <CardContent className="p-5 sm:p-6">
          <PatientForm />
        </CardContent>
      </Card>
    </div>
  );
}
