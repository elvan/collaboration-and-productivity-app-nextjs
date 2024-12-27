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
import type { TaskType } from "@/lib/tasks/task-field-service"

interface TaskTypeSelectorProps {
  taskTypes: TaskType[]
  value?: string
  onChange: (value: string) => void
}

export function TaskTypeSelector({
  taskTypes,
  value,
  onChange,
}: TaskTypeSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedType = taskTypes.find((type) => type.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedType ? (
            <div className="flex items-center gap-2">
              {selectedType.icon && (
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center",
                    selectedType.color
                  )}
                >
                  {Icons[selectedType.icon as keyof typeof Icons]({
                    className: "h-3 w-3",
                  })}
                </span>
              )}
              <span>{selectedType.name}</span>
            </div>
          ) : (
            "Select type..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search task types..." />
          <CommandEmpty>No task type found.</CommandEmpty>
          <CommandGroup>
            {taskTypes.map((type) => (
              <CommandItem
                key={type.id}
                value={type.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <div className="flex items-center gap-2">
                  {type.icon && (
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center",
                        type.color
                      )}
                    >
                      {Icons[type.icon as keyof typeof Icons]({
                        className: "h-3 w-3",
                      })}
                    </span>
                  )}
                  <span>{type.name}</span>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === type.id ? "opacity-100" : "opacity-0"
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
