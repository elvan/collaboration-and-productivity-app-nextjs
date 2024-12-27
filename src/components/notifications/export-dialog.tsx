"use client"

import * as React from "react"
import { format } from "date-fns"
import { Download } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { FilterConditions } from "@/lib/notification-filters"

const exportSchema = z.object({
  format: z.enum(["csv", "json"]),
  includeMetadata: z.boolean().default(false),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
})

interface ExportDialogProps {
  conditions?: FilterConditions
}

export function ExportDialog({ conditions }: ExportDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const form = useForm<z.infer<typeof exportSchema>>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: "csv",
      includeMetadata: false,
      dateRange: undefined,
    },
  })

  const onSubmit = async (values: z.infer<typeof exportSchema>) => {
    try {
      setLoading(true)

      const response = await fetch("/api/notifications/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: values.format,
          conditions,
          includeMetadata: values.includeMetadata,
          dateRange: values.dateRange
            ? {
                start: values.dateRange.from,
                end: values.dateRange.to,
              }
            : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "")

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename || `notifications.${values.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export successful",
        description: "Your notifications have been exported successfully",
      })

      setOpen(false)
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export failed",
        description: "Failed to export notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Notifications</DialogTitle>
          <DialogDescription>
            Export your notifications to a file. Choose your preferred format and
            options.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the format for your exported data
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Range (Optional)</FormLabel>
                  <Calendar
                    mode="range"
                    selected={field.value}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                  />
                  <FormDescription>
                    Select a date range to export notifications from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeMetadata"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Include Metadata
                    </FormLabel>
                    <FormDescription>
                      Export additional metadata fields
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? "Exporting..." : "Export"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
