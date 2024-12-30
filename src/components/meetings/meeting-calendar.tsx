import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NewMeetingDialog } from "./new-meeting-dialog"
import { Plus } from "lucide-react"
import { format } from "date-fns"

interface Meeting {
  id: string
  title: string
  startTime: Date
  endTime: Date
  attendees: {
    id: string
    name: string
    image?: string
  }[]
}

export function MeetingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false)

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["meetings", format(selectedDate, "yyyy-MM")],
    queryFn: async () => {
      const response = await fetch(
        `/api/meetings?month=${format(selectedDate, "yyyy-MM")}`
      )
      if (!response.ok) throw new Error("Failed to fetch meetings")
      return response.json()
    },
  })

  const selectedDayMeetings = meetings?.filter(
    (meeting) =>
      format(new Date(meeting.startTime), "yyyy-MM-dd") ===
      format(selectedDate, "yyyy-MM-dd")
  )

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <Button
          className="w-full"
          onClick={() => setIsNewMeetingOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Meeting
        </Button>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border"
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedDayMeetings?.length || 0} meetings scheduled
            </p>
          </div>
          <ScrollArea className="h-[400px] px-6 pb-6">
            {isLoading ? (
              <div>Loading meetings...</div>
            ) : selectedDayMeetings?.length ? (
              <div className="space-y-4">
                {selectedDayMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No meetings scheduled for this day
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <NewMeetingDialog
        open={isNewMeetingOpen}
        onOpenChange={setIsNewMeetingOpen}
        defaultDate={selectedDate}
      />
    </div>
  )
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <div className="rounded-lg border p-4 hover:bg-accent transition-colors">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{meeting.title}</h4>
          <time className="text-sm text-muted-foreground">
            {format(new Date(meeting.startTime), "h:mm a")} -{" "}
            {format(new Date(meeting.endTime), "h:mm a")}
          </time>
        </div>
        <div className="flex -space-x-2">
          {meeting.attendees.slice(0, 4).map((attendee) => (
            <img
              key={attendee.id}
              src={attendee.image || "/placeholder-avatar.png"}
              alt={attendee.name}
              className="h-8 w-8 rounded-full border-2 border-background"
            />
          ))}
          {meeting.attendees.length > 4 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
              +{meeting.attendees.length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
