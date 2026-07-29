"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "Pick a date and time",
  disabled = false,
  className
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "09:00"
  )

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Parse the time and combine with the selected date
      const [hours, minutes] = timeValue.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes, 0, 0)
      setDate(newDate)
    } else {
      setDate(undefined)
    }
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    if (date) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      setDate(newDate)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <HugeiconsIcon icon={Calendar01Icon} className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP 'at' HH:mm")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </div>
        <div className="p-3 space-y-2">
          <Label htmlFor="time" className="text-sm font-medium">
            Time
          </Label>
          <div className="flex items-center space-x-2">
            <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4 text-muted-foreground" />
            <Input
              id="time"
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="p-3 pt-0">
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full"
            size="sm"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 