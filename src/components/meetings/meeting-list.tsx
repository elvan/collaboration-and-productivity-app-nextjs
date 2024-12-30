import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Video, Users } from "lucide-react"

interface Meeting {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  meetingUrl?: string
  attendees: {
    id: string
    name: string
    image?: string
    status: "accepted" | "declined" | "pending"
  }[]
}

export function MeetingList() {
  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["meetings"],
    queryFn: async () => {
      const response = await fetch("/api/meetings")
      if (!response.ok) throw new Error("Failed to fetch meetings")
      return response.json()
    },
  })

  const getStatusColor = (status: Meeting["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500"
      case "in-progress":
        return "bg-green-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
    }
  }

  if (isLoading) {
    return <div>Loading meetings...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Meeting</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attendees</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings?.map((meeting) => (
            <TableRow key={meeting.id}>
              <TableCell>
                <div className="space-y-1">
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="font-medium hover:underline"
                  >
                    {meeting.title}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {meeting.description}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div>{format(new Date(meeting.startTime), "MMM d, yyyy")}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(meeting.startTime), "h:mm a")} -{" "}
                    {format(new Date(meeting.endTime), "h:mm a")}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("capitalize", getStatusColor(meeting.status))}
                >
                  {meeting.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                  {meeting.attendees.slice(0, 3).map((attendee) => (
                    <Avatar
                      key={attendee.id}
                      className="h-8 w-8 border-2 border-background"
                    >
                      <AvatarImage src={attendee.image} />
                      <AvatarFallback>
                        {attendee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {meeting.attendees.length > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                      +{meeting.attendees.length - 3}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end space-x-2">
                  {meeting.meetingUrl && meeting.status === "in-progress" && (
                    <Button size="sm" variant="outline">
                      <Video className="mr-2 h-4 w-4" />
                      Join
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Meeting</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Cancel Meeting
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
