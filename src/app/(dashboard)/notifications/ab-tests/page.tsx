"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { AbTestDialog } from "@/components/notifications/ab-test-dialog"
import { Badge } from "@/components/ui/badge"

interface ABTest {
  id: string
  name: string
  description?: string
  templateId: string
  variants: any[]
  startDate: string
  endDate?: string
  status: string
  winningVariant?: string
  metrics?: any
  template: {
    name: string
  }
  createdBy: {
    name: string
    email: string
  }
}

export default function NotificationABTests() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [tests, setTests] = React.useState<ABTest[]>([])
  const [status, setStatus] = React.useState<string>()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedTest, setSelectedTest] = React.useState<ABTest>()
  const [metrics, setMetrics] = React.useState<Record<string, any>>()

  // Load tests
  React.useEffect(() => {
    if (session?.user?.id) {
      loadTests()
    }
  }, [session?.user?.id, status])

  const loadTests = async () => {
    try {
      setLoading(true)
      const url = status
        ? `/api/notifications/ab-tests?status=${status}`
        : "/api/notifications/ab-tests"
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("Failed to load tests")
      }
      const data = await res.json()
      setTests(data)
    } catch (error) {
      console.error("Failed to load tests:", error)
      toast({
        title: "Error",
        description: "Failed to load tests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async (testId: string) => {
    try {
      const res = await fetch(
        `/api/notifications/ab-tests?id=${testId}&metrics=true`
      )
      if (!res.ok) {
        throw new Error("Failed to load metrics")
      }
      const data = await res.json()
      setMetrics(data.metrics)
    } catch (error) {
      console.error("Failed to load metrics:", error)
      toast({
        title: "Error",
        description: "Failed to load metrics",
        variant: "destructive",
      })
    }
  }

  const handleCreateTest = async (test: Partial<ABTest>) => {
    try {
      const res = await fetch("/api/notifications/ab-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(test),
      })

      if (!res.ok) {
        throw new Error("Failed to create test")
      }

      toast({
        title: "Success",
        description: "Test created successfully",
      })

      loadTests()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to create test:", error)
      toast({
        title: "Error",
        description: "Failed to create test",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTest = async (test: Partial<ABTest>) => {
    try {
      const res = await fetch("/api/notifications/ab-tests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(test),
      })

      if (!res.ok) {
        throw new Error("Failed to update test")
      }

      toast({
        title: "Success",
        description: "Test updated successfully",
      })

      loadTests()
      setDialogOpen(false)
      setSelectedTest(undefined)
    } catch (error) {
      console.error("Failed to update test:", error)
      toast({
        title: "Error",
        description: "Failed to update test",
        variant: "destructive",
      })
    }
  }

  const handleViewTest = async (test: ABTest) => {
    setSelectedTest(test)
    setDialogOpen(true)
    if (test.status === "active" || test.status === "completed") {
      loadMetrics(test.id)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">A/B Tests</h1>
            <p className="text-muted-foreground mt-2">
              Test and optimize your notification templates
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Test
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {tests.map((test) => (
            <Card
              key={test.id}
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => handleViewTest(test)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>{test.name}</CardTitle>
                    {test.description && (
                      <p className="text-sm text-muted-foreground">
                        {test.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      test.status === "active"
                        ? "default"
                        : test.status === "completed"
                        ? "success"
                        : "secondary"
                    }
                  >
                    {test.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Template</p>
                      <p className="text-sm text-muted-foreground">
                        {test.template.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Created by</p>
                      <p className="text-sm text-muted-foreground">
                        {test.createdBy.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(test.startDate), "PPP")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {test.endDate
                          ? format(new Date(test.endDate), "PPP")
                          : "Not set"}
                      </p>
                    </div>
                  </div>

                  {(test.status === "active" ||
                    test.status === "completed") &&
                    metrics?.[test.id] && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium">Results</p>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={Object.entries(metrics[test.id]).map(
                                ([variantId, data]: [string, any]) => ({
                                  variant: `Variant ${variantId}`,
                                  ...data,
                                })
                              )}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="variant" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar
                                dataKey="deliveryRate"
                                name="Delivery Rate"
                                fill="#8884d8"
                              />
                              <Bar
                                dataKey="readRate"
                                name="Read Rate"
                                fill="#82ca9d"
                              />
                              <Bar
                                dataKey="clickRate"
                                name="Click Rate"
                                fill="#ffc658"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ABTestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        test={selectedTest}
        metrics={metrics?.[selectedTest?.id]}
        onSubmit={selectedTest ? handleUpdateTest : handleCreateTest}
      />
    </div>
  )
}
