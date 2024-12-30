import { Metadata } from "next"
import { Shell } from "@/components/shell"
import { MeetingDetails } from "@/components/meetings/meeting-details"
import { getMeetingById } from "@/lib/meetings"

interface MeetingPageProps {
  params: {
    meetingId: string
  }
}

export const metadata: Metadata = {
  title: "Meeting Details",
  description: "View and manage meeting details",
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const meeting = await getMeetingById(params.meetingId)

  return (
    <Shell>
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <MeetingDetails meeting={meeting} />
      </div>
    </Shell>
  )
}
