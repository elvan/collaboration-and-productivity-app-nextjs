"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Minus,
  Plus,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { CampaignDialog } from "@/components/notifications/campaign-dialog"

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  template: {
    name: string
  }
  metrics?: {
    targetAudience: number
    sentCount: number
    deliveredCount: number
    readCount: number
    clickCount: number
    conversionCount: number
    deliveryRate: number
    readRate: number
    clickRate: number
    conversionRate: number
  }
}

export default function CampaignsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [templates, setTemplates] = React.useState<
    Array<{ id: string; name: string }>
  >([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState<string>()

  // Load campaigns and templates
  React.useEffect(() => {
    if (session?.user?.id) {
      loadCampaigns()
      loadTemplates()
    }
  }, [session?.user?.id, statusFilter])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/notifications/campaigns${
          statusFilter ? `?status=${statusFilter}` : ""
        }`
      )
      if (!res.ok) {
        throw new Error("Failed to load campaigns")
      }
      const data = await res.json()
      setCampaigns(data)
    } catch (error) {
      console.error("Failed to load campaigns:", error)
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/notifications/templates")
      if (!res.ok) {
        throw new Error("Failed to load templates")
      }
      const data = await res.json()
      setTemplates(data)
    } catch (error) {
      console.error("Failed to load templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    }
  }

  const handleCreateCampaign = async (data: any) => {
    try {
      const res = await fetch("/api/notifications/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error("Failed to create campaign")
      }

      toast({
        title: "Success",
        description: "Campaign created successfully",
      })

      loadCampaigns()
    } catch (error) {
      console.error("Failed to create campaign:", error)
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(
        `/api/notifications/campaigns?id=${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      )

      if (!res.ok) {
        throw new Error("Failed to update campaign")
      }

      toast({
        title: "Success",
        description: "Campaign updated successfully",
      })

      loadCampaigns()
    } catch (error) {
      console.error("Failed to update campaign:", error)
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      })
    }
  }

  const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "scheduled":
        return "bg-blue-500"
      case "active":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "completed":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
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
            <h1 className="text-2xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Manage your notification campaigns
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {campaign.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={getStatusColor(campaign.status)}
                      >
                        {campaign.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Template: {campaign.template.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {campaign.status === "draft" && (
                      <Button
                        onClick={() =>
                          handleUpdateStatus(
                            campaign.id,
                            "scheduled"
                          )
                        }
                      >
                        Schedule
                      </Button>
                    )}
                    {campaign.status === "scheduled" && (
                      <Button
                        onClick={() =>
                          handleUpdateStatus(campaign.id, "active")
                        }
                      >
                        Activate
                      </Button>
                    )}
                    {campaign.status === "active" && (
                      <Button
                        onClick={() =>
                          handleUpdateStatus(campaign.id, "paused")
                        }
                      >
                        Pause
                      </Button>
                    )}
                    {campaign.status === "paused" && (
                      <Button
                        onClick={() =>
                          handleUpdateStatus(campaign.id, "active")
                        }
                      >
                        Resume
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {campaign.metrics && (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Target Audience
                          </p>
                          <p className="text-2xl font-bold">
                            {campaign.metrics.targetAudience}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Delivery Rate
                          </p>
                          <p className="text-2xl font-bold">
                            {formatRate(campaign.metrics.deliveryRate)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Read Rate
                          </p>
                          <p className="text-2xl font-bold">
                            {formatRate(campaign.metrics.readRate)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Conversion Rate
                          </p>
                          <p className="text-2xl font-bold">
                            {formatRate(campaign.metrics.conversionRate)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {campaign.description && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      {campaign.description}
                    </p>
                  )}
                  {(campaign.startDate || campaign.endDate) && (
                    <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
                      {campaign.startDate && (
                        <span>
                          Start:{" "}
                          {format(
                            new Date(campaign.startDate),
                            "PPP"
                          )}
                        </span>
                      )}
                      {campaign.endDate && (
                        <span>
                          End:{" "}
                          {format(new Date(campaign.endDate), "PPP")}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        templates={templates}
        onSubmit={handleCreateCampaign}
      />
    </div>
  )
}
