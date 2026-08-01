'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { recordVitalsAction } from '@/app/actions';
import { useDelayedRefresh } from '@/components/auto-refresh';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

/** Empty string → undefined, so a blank field isn't recorded as 0. */
const measurement = (min: number, max: number) =>
  z
    .union([z.literal(''), z.coerce.number().min(min).max(max)])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : Number(v)));

const schema = z
  .object({
    systolic: measurement(40, 300),
    diastolic: measurement(20, 200),
    heartRate: measurement(20, 300),
    temperatureC: measurement(30, 45),
    weightKg: measurement(0, 500),
  })
  .refine(
    (v) =>
      [v.systolic, v.diastolic, v.heartRate, v.temperatureC, v.weightKg].some(
        (n) => n !== undefined,
      ),
    { message: 'Enter at least one measurement.', path: ['systolic'] },
  )
  .refine((v) => (v.systolic === undefined) === (v.diastolic === undefined), {
    message: 'Blood pressure needs both systolic and diastolic.',
    path: ['diastolic'],
  });

type FormValues = z.input<typeof schema>;

const FIELDS = [
  { name: 'systolic', label: 'Systolic', placeholder: '120', step: '1' },
  { name: 'diastolic', label: 'Diastolic', placeholder: '80', step: '1' },
  { name: 'heartRate', label: 'Heart rate', placeholder: '72', step: '1' },
  { name: 'temperatureC', label: 'Temp °C', placeholder: '36.8', step: '0.1' },
  { name: 'weightKg', label: 'Weight kg', placeholder: '70', step: '0.1' },
] as const;

export function VitalsForm({ patientId }: { patientId: string }) {
  const [saving, setSaving] = useState(false);
  const refreshSoon = useDelayedRefresh();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      systolic: '',
      diastolic: '',
      heartRate: '',
      temperatureC: '',
      weightKg: '',
    },
  });

  async function onSubmit(values: FormValues) {
    const parsed = schema.parse(values);
    setSaving(true);
    const result = await recordVitalsAction({ patientId, ...parsed });
    setSaving(false);

    if (result.success) {
      toast.success('Vitals recorded');
      form.reset();
      // Observations are read back through a search, which trails the write by
      // a few seconds — re-render until they show up.
      refreshSoon();
      return;
    }

    toast.error('Could not record vitals', { description: result.error });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* This form lives in a ~1/3-page column on desktop — five columns
            there squeezes each input below its own placeholder. Two across is
            the widest that stays legible at every breakpoint. */}
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">{f.label}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={f.step}
                      placeholder={f.placeholder}
                      {...field}
                      value={(field.value as string | number | undefined) ?? ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          ))}
        </div>

        <Button type="submit" size="sm" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Recording…' : 'Record vitals'}
        </Button>
      </form>
    </Form>
  );
}
