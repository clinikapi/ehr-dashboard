'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { recordVitalsAction } from '@/app/actions';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
const labelCls = 'mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400';

function num(v: FormDataEntryValue | null): number | undefined {
  const n = Number(v);
  return v !== null && v !== '' && Number.isFinite(n) ? n : undefined;
}

export function VitalsForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await recordVitalsAction({
      patientId,
      systolic: num(form.get('systolic')),
      diastolic: num(form.get('diastolic')),
      heartRate: num(form.get('heartRate')),
      temperatureC: num(form.get('temperatureC')),
      weightKg: num(form.get('weightKg')),
    });
    if (result.success) {
      setMessage({ tone: 'ok', text: 'Vitals recorded.' });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setMessage({ tone: 'err', text: result.error ?? 'Could not record vitals.' });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div>
          <label htmlFor="systolic" className={labelCls}>Systolic</label>
          <input id="systolic" name="systolic" type="number" min={40} max={300} placeholder="120" className={inputCls} />
        </div>
        <div>
          <label htmlFor="diastolic" className={labelCls}>Diastolic</label>
          <input id="diastolic" name="diastolic" type="number" min={20} max={200} placeholder="80" className={inputCls} />
        </div>
        <div>
          <label htmlFor="heartRate" className={labelCls}>Heart rate</label>
          <input id="heartRate" name="heartRate" type="number" min={20} max={300} placeholder="72" className={inputCls} />
        </div>
        <div>
          <label htmlFor="temperatureC" className={labelCls}>Temp °C</label>
          <input id="temperatureC" name="temperatureC" type="number" step="0.1" min={30} max={45} placeholder="36.8" className={inputCls} />
        </div>
        <div>
          <label htmlFor="weightKg" className={labelCls}>Weight kg</label>
          <input id="weightKg" name="weightKg" type="number" step="0.1" min={0} max={500} placeholder="70" className={inputCls} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black text-white shadow transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Recording…' : 'Record vitals'}
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
