"use client"

// Single-date picker = Popover + Calendar + month/year dropdowns. A drop-in replacement
// for `<Input type="date">`: value and onChange use `yyyy-MM-dd` strings, so it works with
// both plain useState fields and React Hook Form `field.value` / `field.onChange`.
// Sibling primitive alongside `date-range-picker.tsx` and `datetime-picker.tsx`.

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { Calendar01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Earliest selectable date, `yyyy-MM-dd`. */
  min?: string
  /** Latest selectable date, `yyyy-MM-dd`. */
  max?: string
  className?: string
  id?: string
}

function toDate(value?: string): Date | undefined {
  if (!value) return undefined
  const d = parseISO(value)
  return isValid(d) ? d : undefined
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  min,
  max,
  className,
  id,
}: DatePickerProps) {
  const selected = toDate(value)
  const minDate = toDate(min)
  const maxDate = toDate(max)

  const currentYear = new Date().getFullYear()
  const startYear = minDate ? minDate.getFullYear() : 1900
  const endYear = maxDate ? maxDate.getFullYear() : currentYear + 10
  const years = React.useMemo(
    () => Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i),
    [startYear, endYear],
  )

  const [open, setOpen] = React.useState(false)
  const [displayMonth, setDisplayMonth] = React.useState<Date>(selected ?? maxDate ?? new Date())

  // Keep the displayed month in sync when the popover opens or the value changes.
  React.useEffect(() => {
    if (open) setDisplayMonth(selected ?? maxDate ?? new Date())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value])

  const isDisabledDay = (d: Date) =>
    (minDate ? d < minDate : false) || (maxDate ? d > maxDate : false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start pl-3 text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <HugeiconsIcon icon={Calendar01Icon} className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, "yyyy-MM-dd") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
        <div className="flex gap-2 p-3 border-b">
          <Select
            value={String(displayMonth.getMonth())}
            onValueChange={(v) => {
              const d = new Date(displayMonth)
              d.setMonth(parseInt(v, 10))
              setDisplayMonth(d)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(displayMonth.getFullYear())}
            onValueChange={(v) => {
              const d = new Date(displayMonth)
              d.setFullYear(parseInt(v, 10))
              setDisplayMonth(d)
            }}
          >
            <SelectTrigger className="w-[95px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={selected}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"))
              setOpen(false)
            }
          }}
          disabled={isDisabledDay}
          startMonth={new Date(startYear, 0)}
          endMonth={new Date(endYear, 11)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
