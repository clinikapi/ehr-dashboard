'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { createAppointmentAction } from '@/app/actions';
import { useDelayedRefresh } from '@/components/auto-refresh';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DURATIONS = [15, 30, 45, 60, 90, 120];

const TYPES = [
  { value: 'routine', label: 'Routine' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'walkin', label: 'Walk-in' },
  { value: 'urgent', label: 'Urgent' },
] as const;

const schema = z.object({
  patientId: z.string().min(1, 'Choose a patient'),
  start: z.date({ required_error: 'Pick a date and time' }),
  minutesDuration: z.coerce.number().int().min(5).max(480),
  appointmentType: z.enum(['routine', 'followup', 'walkin', 'urgent']),
  description: z.string().trim().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

export function AppointmentForm({ patients }: { patients: Array<{ id: string; label: string }> }) {
  const [saving, setSaving] = useState(false);
  const refreshSoon = useDelayedRefresh();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: '',
      minutesDuration: 30,
      appointmentType: 'routine',
      description: '',
    },
  });

  const noPatients = patients.length === 0;

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const result = await createAppointmentAction({
      patientId: values.patientId,
      start: values.start.toISOString(),
      minutesDuration: values.minutesDuration,
      description: values.description || undefined,
      appointmentType: values.appointmentType,
    });
    setSaving(false);

    if (result.success) {
      toast.success('Appointment booked', {
        description: 'It joins the schedule as soon as the index catches up.',
      });
      form.reset({
        patientId: '',
        minutesDuration: 30,
        appointmentType: 'routine',
        description: '',
        start: undefined,
      });
      // The schedule below is a search — a booking takes a few seconds to
      // appear in it. Pull it back in rather than leaving a stale list.
      refreshSoon();
      return;
    }

    toast.error('Could not book appointment', { description: result.error });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <FormControl>
                <Combobox
                  options={patients.map((p) => ({ value: p.id, label: p.label }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={noPatients ? 'No patients — create one first' : 'Select a patient'}
                  emptyText="No patient matches that name."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Starts</FormLabel>
              <FormControl>
                <DateTimePicker date={field.value} setDate={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <FormField
            control={form.control}
            name="minutesDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input placeholder="Annual physical" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={saving || noPatients} className="w-full sm:w-auto">
          {saving ? 'Booking…' : 'Book appointment'}
        </Button>
      </form>
    </Form>
  );
}
