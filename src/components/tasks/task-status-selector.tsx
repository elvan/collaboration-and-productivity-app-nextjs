import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Icons } from "@/components/icons"
import type { TaskStatus } from "@/lib/tasks/task-field-service"

interface TaskStatusSelectorProps {
  statuses: TaskStatus[]
  value?: string
  onChange: (value: string) => void
}

export function TaskStatusSelector({
  statuses,
  value,
  onChange,
}: TaskStatusSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedStatus = statuses.find((status) => status.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedStatus ? (
            <div className="flex items-center gap-2">
              {selectedStatus.metadata?.icon && (
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center",
                    selectedStatus.color
                  )}
                >
                  {
                    Icons[
                      selectedStatus.metadata.icon as keyof typeof Icons
                    ]({
                      className: "h-3 w-3",
                    })
                  }
                </span>
              )}
              <span
                className={cn(
                  "inline-flex h-2 w-2 rounded-full",
                  selectedStatus.color
                )}
              />
              <span>{selectedStatus.name}</span>
            </div>
          ) : (
            "Select status..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search statuses..." />
          <CommandEmpty>No status found.</CommandEmpty>
          <CommandGroup>
            {statuses.map((status) => (
              <CommandItem
                key={status.id}
                value={status.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <div className="flex items-center gap-2">
                  {status.metadata?.icon && (
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center",
                        status.color
                      )}
                    >
                      {
                        Icons[
                          status.metadata.icon as keyof typeof Icons
                        ]({
                          className: "h-3 w-3",
                        })
                      }
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex h-2 w-2 rounded-full",
                      status.color
                    )}
                  />
                  <span>{status.name}</span>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === status.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
