import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2 } from "lucide-react"
import {
  customFieldTypes,
  customFieldSchema,
  type CustomField,
} from "@/lib/tasks/custom-field-service"

const fieldTypeDescriptions = {
  text: "Single-line or multi-line text input",
  number: "Numeric values with optional validation",
  date: "Date and time picker",
  select: "Single option from a predefined list",
  multiselect: "Multiple options from a predefined list",
  user: "Select project members",
  url: "URL with validation",
  email: "Email address with validation",
  phone: "Phone number with formatting",
  currency: "Monetary values with currency symbol",
}

interface CustomFieldsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CustomField) => Promise<void>
  defaultValues?: CustomField
  projectId: string
}

export function CustomFieldsDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  projectId,
}: CustomFieldsDialogProps) {
  const [showOptions, setShowOptions] = useState(
    defaultValues?.type === "select" || defaultValues?.type === "multiselect"
  )
  const [showValidation, setShowValidation] = useState(
    !!defaultValues?.validation
  )

  const form = useForm<CustomField>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      type: "text",
      required: false,
      projectId,
    },
  })

  const fieldType = form.watch("type")

  async function handleSubmit(data: CustomField) {
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save custom field:", error)
    }
  }

  function addOption() {
    const options = form.getValues("options") || []
    form.setValue("options", [
      ...options,
      { label: "", value: "", color: "#000000" },
    ])
  }

  function removeOption(index: number) {
    const options = form.getValues("options") || []
    form.setValue(
      "options",
      options.filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit" : "Create"} Custom Field
          </DialogTitle>
          <DialogDescription>
            Configure a custom field for tasks in this project
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter field name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter field description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      setShowOptions(
                        value === "select" || value === "multiselect"
                      )
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customFieldTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fieldTypeDescriptions[type]}
                            </div>
                          </div>
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
              name="required"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Required</FormLabel>
                    <FormDescription>
                      Make this field mandatory for all tasks
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

            {showOptions && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle>Options</CardTitle>
                      <CardDescription>
                        Define options for select/multiselect fields
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.watch("options")?.map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4"
                    >
                      <FormField
                        control={form.control}
                        name={`options.${index}.label`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Option label"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`options.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Option value"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`options.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="color"
                                className="h-10 w-20"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Validation</CardTitle>
                    <CardDescription>
                      Set validation rules for the field
                    </CardDescription>
                  </div>
                  <Switch
                    checked={showValidation}
                    onCheckedChange={setShowValidation}
                  />
                </div>
              </CardHeader>
              {showValidation && (
                <CardContent className="space-y-4">
                  {(fieldType === "number" ||
                    fieldType === "currency") && (
                    <>
                      <FormField
                        control={form.control}
                        name="validation.min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="validation.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {(fieldType === "text" ||
                    fieldType === "email" ||
                    fieldType === "url" ||
                    fieldType === "phone") && (
                    <FormField
                      control={form.control}
                      name="validation.pattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pattern (Regex)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter validation pattern"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              )}
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {defaultValues ? "Update" : "Create"} Field
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
