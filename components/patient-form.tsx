'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createPatientAction } from '@/app/actions';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400';

export function PatientForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await createPatientAction({
      firstName: String(form.get('firstName') ?? ''),
      lastName: String(form.get('lastName') ?? ''),
      gender: (form.get('gender') as 'male' | 'female' | 'other' | 'unknown') || undefined,
      birthDate: String(form.get('birthDate') ?? '') || undefined,
      email: String(form.get('email') ?? '') || undefined,
      phone: String(form.get('phone') ?? '') || undefined,
    });
    if (result.success && result.data) {
      router.push(`/patients/${result.data.id}`);
      return;
    }
    setError(result.error ?? 'Could not create patient.');
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelCls}>First name *</label>
          <input id="firstName" name="firstName" required className={inputCls} placeholder="Amara" />
        </div>
        <div>
          <label htmlFor="lastName" className={labelCls}>Last name *</label>
          <input id="lastName" name="lastName" required className={inputCls} placeholder="Okafor" />
        </div>
        <div>
          <label htmlFor="gender" className={labelCls}>Gender</label>
          <select id="gender" name="gender" className={inputCls} defaultValue="">
            <option value="">Not specified</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label htmlFor="birthDate" className={labelCls}>Date of birth</label>
          <input id="birthDate" name="birthDate" type="date" className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Email</label>
          <input id="email" name="email" type="email" className={inputCls} placeholder="amara@example.com" />
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>Phone</label>
          <input id="phone" name="phone" type="tel" className={inputCls} placeholder="+1 555 0100" />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white shadow-lg transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? 'Creating…' : 'Create patient'}
      </button>
    </form>
  );
}
