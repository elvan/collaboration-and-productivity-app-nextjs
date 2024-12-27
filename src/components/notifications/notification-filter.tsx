"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Save, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  FilterConditions,
  NotificationFilterOptions,
  saveFilter,
} from "@/lib/notification-filters"

interface NotificationFilterProps {
  initialConditions?: FilterConditions
  onFilterChange: (conditions: FilterConditions) => void
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void
}

const sortOptions = [
  { label: "Date (Newest)", value: "createdAt:desc" },
  { label: "Date (Oldest)", value: "createdAt:asc" },
  { label: "Priority (High to Low)", value: "priority:desc" },
  { label: "Priority (Low to High)", value: "priority:asc" },
]

const priorityOptions = [
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
]

export function NotificationFilter({
  initialConditions,
  onFilterChange,
  onSortChange,
}: NotificationFilterProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [conditions, setConditions] = React.useState<FilterConditions>(
    initialConditions || {}
  )
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)
  const [filterName, setFilterName] = React.useState("")
  const [filterDescription, setFilterDescription] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(false)

  const debouncedConditions = useDebounce(conditions, 300)

  React.useEffect(() => {
    onFilterChange(debouncedConditions)
  }, [debouncedConditions, onFilterChange])

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(":")
    onSortChange?.(sortBy, sortOrder as "asc" | "desc")
  }

  const handleSaveFilter = async () => {
    if (!session?.user?.id) return

    try {
      await saveFilter(
        session.user.id,
        filterName,
        {
          conditions,
        },
        filterDescription,
        isDefault
      )

      toast({
        title: "Filter saved",
        description: "Your filter has been saved successfully",
      })

      setSaveDialogOpen(false)
      setFilterName("")
      setFilterDescription("")
      setIsDefault(false)
    } catch (error) {
      console.error("Failed to save filter:", error)
      toast({
        title: "Error",
        description: "Failed to save filter",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Select onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide Filters" : "Show Filters"}
          </Button>

          {Object.keys(conditions).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConditions({})}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSaveDialogOpen(true)}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Filter
        </Button>
      </div>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <Input
              placeholder="Search notifications..."
              value={conditions.search || ""}
              onChange={(e) =>
                setConditions((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={conditions.priority as string}
              onValueChange={(value) =>
                setConditions((prev) => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !conditions.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {conditions.startDate ? (
                    conditions.endDate ? (
                      <>
                        {format(conditions.startDate, "LLL dd, y")} -{" "}
                        {format(conditions.endDate, "LLL dd, y")}
                      </>
                    ) : (
                      format(conditions.startDate, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={conditions.startDate}
                  selected={{
                    from: conditions.startDate,
                    to: conditions.endDate,
                  }}
                  onSelect={(range: any) =>
                    setConditions((prev) => ({
                      ...prev,
                      startDate: range?.from,
                      endDate: range?.to,
                    }))
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Read/Unread */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={conditions.read === false}
                  onCheckedChange={(checked) =>
                    setConditions((prev) => ({
                      ...prev,
                      read: checked ? false : undefined,
                    }))
                  }
                />
                <span>Unread Only</span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={conditions.dismissed === false}
                  onCheckedChange={(checked) =>
                    setConditions((prev) => ({
                      ...prev,
                      dismissed: checked ? false : undefined,
                    }))
                  }
                />
                <span>Active Only</span>
              </div>
            </div>
          </div>

          {/* Batch */}
          <div className="space-y-2">
            <Label>Batch</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={conditions.isBatch}
                onCheckedChange={(checked) =>
                  setConditions((prev) => ({
                    ...prev,
                    isBatch: checked || undefined,
                  }))
                }
              />
              <span>Show Batched Only</span>
            </div>
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current filter settings for quick access later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Filter Name</Label>
              <Input
                placeholder="Enter filter name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Enter filter description"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
              <span>Set as default filter</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!filterName}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
