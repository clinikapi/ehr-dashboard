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
} from '@clinikapi/react';

const PROXY = '/api/clinikapi';

interface PatientOption {
  id: string;
  label: string;
}

const WIDGETS: Array<{
  name: string;
  needsPatient: boolean;
  render: (patientId: string) => React.ReactNode;
}> = [
  { name: 'PatientDashboard', needsPatient: true, render: (id) => <PatientDashboard proxyUrl={PROXY} patientId={id} /> },
  { name: 'VitalsWidget', needsPatient: true, render: (id) => <VitalsWidget proxyUrl={PROXY} patientId={id} /> },
  { name: 'LabResultsWidget', needsPatient: true, render: (id) => <LabResultsWidget proxyUrl={PROXY} patientId={id} /> },
  { name: 'PrescriptionWidget', needsPatient: true, render: (id) => <PrescriptionWidget proxyUrl={PROXY} patientId={id} /> },
  { name: 'PrescriptionForm', needsPatient: true, render: (id) => <PrescriptionForm proxyUrl={PROXY} patientId={id} /> },
  { name: 'AppointmentScheduler', needsPatient: true, render: (id) => <AppointmentScheduler proxyUrl={PROXY} patientId={id} /> },
  { name: 'IntakeForm', needsPatient: true, render: (id) => <IntakeForm proxyUrl={PROXY} patientId={id} /> },
  { name: 'ConsentManager', needsPatient: true, render: (id) => <ConsentManager proxyUrl={PROXY} patientId={id} /> },
  { name: 'NoteEditor', needsPatient: true, render: (id) => <NoteEditor proxyUrl={PROXY} patientId={id} /> },
  { name: 'ConditionTracker', needsPatient: true, render: (id) => <ConditionTracker proxyUrl={PROXY} patientId={id} /> },
  { name: 'AllergyRecorder', needsPatient: true, render: (id) => <AllergyRecorder proxyUrl={PROXY} patientId={id} /> },
  { name: 'ImmunizationLogger', needsPatient: true, render: (id) => <ImmunizationLogger proxyUrl={PROXY} patientId={id} /> },
  { name: 'CarePlanBuilder', needsPatient: true, render: (id) => <CarePlanBuilder proxyUrl={PROXY} patientId={id} /> },
  { name: 'GoalSetter', needsPatient: true, render: (id) => <GoalSetter proxyUrl={PROXY} patientId={id} /> },
];

export function WidgetGallery({ patients }: { patients: PatientOption[] }) {
  const [patientId, setPatientId] = useState<string>(patients[0]?.id ?? '');
  const [active, setActive] = useState<string>(WIDGETS[0].name);

  const widget = WIDGETS.find((w) => w.name === active) ?? WIDGETS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Patient context
        </label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          {patients.length === 0 && <option value="">No patients — create one first</option>}
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({p.id})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {WIDGETS.map((w) => (
          <button
            key={w.name}
            onClick={() => setActive(w.name)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
              active === w.name
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {w.name}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="mb-4 font-mono text-[11px] font-bold text-slate-400">
          {'<'}
          {widget.name} proxyUrl=&quot;{PROXY}&quot; patientId=&quot;{patientId || '—'}&quot;{' />'}
        </p>
        {widget.needsPatient && !patientId ? (
          <p className="py-8 text-center text-sm font-medium text-slate-400">
            Create a patient first, then pick one above to mount this widget.
          </p>
        ) : (
          <div key={`${widget.name}-${patientId}`}>{widget.render(patientId)}</div>
        )}
      </div>
    </div>
  );
}
