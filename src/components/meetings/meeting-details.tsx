import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Video, Users, MessageSquare, Calendar } from "lucide-react"

interface Meeting {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  meetingUrl?: string
  notes?: string
  attendees: {
    id: string
    name: string
    image?: string
    status: "accepted" | "declined" | "pending"
  }[]
  messages: {
    id: string
    content: string
    createdAt: Date
    user: {
      id: string
      name: string
      image?: string
    }
  }[]
}

interface MeetingDetailsProps {
  meeting: Meeting
}

export function MeetingDetails({ meeting }: MeetingDetailsProps) {
  const queryClient = useQueryClient()

  const { mutate: updateMeetingStatus } = useMutation({
    mutationFn: async (status: Meeting["status"]) => {
      const response = await fetch(`/api/meetings/${meeting.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Failed to update meeting status")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", meeting.id] })
    },
  })

  const { mutate: sendMessage } = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/meetings/${meeting.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error("Failed to send message")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", meeting.id] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{meeting.title}</h1>
          <p className="text-muted-foreground">{meeting.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          {meeting.meetingUrl && meeting.status === "in-progress" && (
            <Button>
              <Video className="mr-2 h-4 w-4" />
              Join Meeting
            </Button>
          )}
          <Badge
            variant="secondary"
            className="capitalize"
          >
            {meeting.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Tabs defaultValue="discussion" className="space-y-4">
          <TabsList>
            <TabsTrigger value="discussion">
              <MessageSquare className="mr-2 h-4 w-4" />
              Discussion
            </TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="discussion" className="space-y-4">
            <ScrollArea className="h-[600px] rounded-md border p-4">
              <div className="space-y-4">
                {meeting.messages.map((message) => (
                  <div key={message.id} className="flex space-x-4">
                    <Avatar>
                      <AvatarImage src={message.user.image} />
                      <AvatarFallback>
                        {message.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {message.user.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(
                            new Date(message.createdAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </span>
                      </div>
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="notes">
            <div className="rounded-md border p-4">
              <p className="whitespace-pre-wrap">{meeting.notes}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Meeting Details</h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(meeting.startTime), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground">Time:</span>
                <span className="ml-2">
                  {format(new Date(meeting.startTime), "h:mm a")} -{" "}
                  {format(new Date(meeting.endTime), "h:mm a")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Attendees</h3>
              <span className="text-sm text-muted-foreground">
                {meeting.attendees.length} people
              </span>
            </div>
            <ScrollArea className="h-[300px] mt-2">
              <div className="space-y-4">
                {meeting.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={attendee.image} />
                        <AvatarFallback>
                          {attendee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{attendee.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {attendee.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
