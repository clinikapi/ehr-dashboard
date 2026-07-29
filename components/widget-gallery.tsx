'use client';

// Every widget @clinikapi/react ships, wired to the real backend proxy
// (/api/clinikapi). This page doubles as the package's live test surface:
// each widget renders, and every action it fires flows browser → proxy →
// @clinikapi/sdk → api.clinikapi.com.
import { useState } from 'react';
import {
  AllergyRecorder,
  AppointmentScheduler,
  CarePlanBuilder,
  ConditionTracker,
  ConsentManager,
  GoalSetter,
  ImmunizationLogger,
  IntakeForm,
  LabResultsWidget,
  NoteEditor,
  PatientDashboard,
  PrescriptionForm,
  PrescriptionWidget,
  VitalsWidget,
  type WidgetTheme,
} from '@clinikapi/react';

// The one line of setup @clinikapi/react needs. Every rule in it is scoped to
// the widgets' own root, so it can't reach the rest of this app.
import '@clinikapi/react/styles.css';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PROXY = '/api/clinikapi';

interface PatientOption {
  id: string;
  label: string;
}

const WIDGETS: Array<{
  name: string;
  render: (patientId: string, theme: WidgetTheme) => React.ReactNode;
}> = [
  { name: 'PatientDashboard', render: (id, t) => <PatientDashboard proxyUrl={PROXY} patientId={id} theme={t as 'light' | 'dark' | 'glassmorphism'} /> },
  { name: 'VitalsWidget', render: (id, t) => <VitalsWidget proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'LabResultsWidget', render: (id, t) => <LabResultsWidget proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'PrescriptionWidget', render: (id, t) => <PrescriptionWidget proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'PrescriptionForm', render: (id, t) => <PrescriptionForm proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'AppointmentScheduler', render: (id, t) => <AppointmentScheduler proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'IntakeForm', render: (id, t) => <IntakeForm proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'ConsentManager', render: (id, t) => <ConsentManager proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'NoteEditor', render: (id, t) => <NoteEditor proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'ConditionTracker', render: (id, t) => <ConditionTracker proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'AllergyRecorder', render: (id, t) => <AllergyRecorder proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'ImmunizationLogger', render: (id, t) => <ImmunizationLogger proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'CarePlanBuilder', render: (id, t) => <CarePlanBuilder proxyUrl={PROXY} patientId={id} theme={t} /> },
  { name: 'GoalSetter', render: (id, t) => <GoalSetter proxyUrl={PROXY} patientId={id} theme={t} /> },
];

const THEMES: Array<{ value: WidgetTheme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'glassmorphism', label: 'Glass' },
  { value: 'inherit', label: 'Inherit app theme' },
];

export function WidgetGallery({ patients }: { patients: PatientOption[] }) {
  const [patientId, setPatientId] = useState<string>(patients[0]?.id ?? '');
  const [active, setActive] = useState<string>(WIDGETS[0].name);
  const [theme, setTheme] = useState<WidgetTheme>('light');

  const widget = WIDGETS.find((w) => w.name === active) ?? WIDGETS[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="patient-context">Patient context</Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger id="patient-context">
              <SelectValue
                placeholder={
                  patients.length === 0 ? 'No patients — create one first' : 'Select a patient'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="widget-theme">Widget theme</Label>
          <Select value={theme} onValueChange={(v) => setTheme(v as WidgetTheme)}>
            <SelectTrigger id="widget-theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {WIDGETS.map((w) => (
          <Button
            key={w.name}
            type="button"
            size="sm"
            variant={active === w.name ? 'default' : 'outline'}
            onClick={() => setActive(w.name)}
            className={cn('rounded-full text-xs', active !== w.name && 'text-muted-foreground')}
          >
            {w.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <p className="mb-4 overflow-x-auto font-mono text-[11px] text-muted-foreground">
            {'<'}
            {widget.name} proxyUrl=&quot;{PROXY}&quot; patientId=&quot;{patientId || '—'}&quot;
            {theme !== 'light' ? ` theme="${theme}"` : ''}
            {' />'}
          </p>
          {!patientId ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Create a patient first, then pick one above to mount this widget.
            </p>
          ) : (
            <div
              key={`${widget.name}-${patientId}-${theme}`}
              className={cn(
                'flex justify-center rounded-lg p-4 sm:p-6',
                theme === 'light' && 'bg-muted/40',
                (theme === 'dark' || theme === 'glassmorphism') && 'bg-slate-900',
              )}
            >
              {widget.render(patientId, theme)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
