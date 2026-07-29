"use client"

import * as React from "react"
import { Tick02Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string; category?: string }[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
  renderOption?: (option: { value: string; label: string; category?: string }) => React.ReactNode
}

function ComboboxImpl({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  emptyText = "No results found.",
  className,
  renderOption,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [mounted, setMounted] = React.useState(false)

  // Handle hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options

    const searchTerms = searchQuery.toLowerCase().split(" ").filter(Boolean)

    return options.filter((option) => {
      const label = option.label.toLowerCase()
      return searchTerms.every(term => label.includes(term))
    })
  }, [options, searchQuery])

  // Group options by category if present
  const groupedOptions = React.useMemo(() => {
    if (!filteredOptions.some(option => option.category)) {
      return { "": filteredOptions }
    }

    return filteredOptions.reduce((acc, option) => {
      const category = option.category || ""
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(option)
      return acc
    }, {} as Record<string, typeof filteredOptions>)
  }, [filteredOptions])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        role="combobox"
        className={cn("w-full justify-between", className)}
      >
        {value
          ? options.find((option) => option.value === value)?.label
          : placeholder}
        <HugeiconsIcon icon={ArrowDown01Icon} className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        // If the popover is closing without a direct selection,
        // we should not cancel the search/dropdown immediately
        // to avoid race conditions with the selection handlers
        if (isOpen) {
          setOpen(true);
        } else {
          // When closing, use timeout to avoid race conditions
          // with the onSelect handler
          setTimeout(() => {
            setOpen(false);
            setSearchQuery("");
          }, 100);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between overflow-hidden", className)}
        >
          <span className="truncate mr-1 flex-1 text-left">
            {value && options.length
              ? options.find((option) => option.value === value)?.label || value
              : placeholder}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9 sm:h-10"
          />
          <CommandList className="max-h-[250px] sm:max-h-[300px] md:max-h-[350px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            {Object.entries(groupedOptions).map(([category, categoryOptions], categoryIndex) => (
              <React.Fragment key={category || categoryIndex}>
                {category && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                )}
                <CommandGroup>
                  {categoryOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      className="py-1.5 sm:py-2"
                      onSelect={(currentValue) => {
                        // Directly set the value without setTimeout to avoid race conditions
                        const newValue = typeof currentValue === 'string'
                          ? (currentValue === value ? "" : currentValue)
                          : (option.value === value ? "" : option.value);

                        // First invoke the value change callback
                        onValueChange?.(newValue);

                        // Don't set open state here - the popover onOpenChange handler will 
                        // take care of it with the proper timing via setTimeout
                      }}
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        option.label
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {categoryIndex < Object.entries(groupedOptions).length - 1 && (
                  <CommandSeparator />
                )}
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Export a memoized version of the Combobox to prevent unnecessary re-renders
export const Combobox = React.memo(ComboboxImpl, (prevProps, nextProps) => {
  // Only re-render if one of these props changes
  return (
    prevProps.value === nextProps.value &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className &&
    // Do a shallow comparison of options length - this is a compromise between
    // performance and correctness. A full deep comparison would be too expensive.
    prevProps.options.length === nextProps.options.length
  );
}); 