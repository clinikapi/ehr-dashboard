'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createAppointmentAction } from '@/app/actions';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400';

export function AppointmentForm({ patients }: { patients: Array<{ id: string; label: string }> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await createAppointmentAction({
      patientId: String(form.get('patientId') ?? ''),
      start: String(form.get('start') ?? ''),
      minutesDuration: Number(form.get('minutesDuration') ?? 30) || 30,
      description: String(form.get('description') ?? '') || undefined,
      appointmentType: String(form.get('appointmentType') ?? '') || undefined,
    });
    if (result.success) {
      setMessage({ tone: 'ok', text: 'Appointment booked.' });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setMessage({ tone: 'err', text: result.error ?? 'Could not book appointment.' });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="patientId" className={labelCls}>Patient *</label>
          <select id="patientId" name="patientId" required className={inputCls} defaultValue="">
            <option value="" disabled>
              {patients.length === 0 ? 'No patients — create one first' : 'Select a patient…'}
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="start" className={labelCls}>Start *</label>
          <input id="start" name="start" type="datetime-local" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="minutesDuration" className={labelCls}>Duration (min)</label>
          <input id="minutesDuration" name="minutesDuration" type="number" min={5} max={480} defaultValue={30} className={inputCls} />
        </div>
        <div>
          <label htmlFor="appointmentType" className={labelCls}>Type</label>
          <select id="appointmentType" name="appointmentType" className={inputCls} defaultValue="routine">
            <option value="routine">Routine</option>
            <option value="followup">Follow-up</option>
            <option value="walkin">Walk-in</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className={labelCls}>Reason</label>
          <input id="description" name="description" className={inputCls} placeholder="Annual physical" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || patients.length === 0}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white shadow-lg transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Booking…' : 'Book appointment'}
        </button>
        {message && (
          <span className={`text-xs font-bold ${message.tone === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
