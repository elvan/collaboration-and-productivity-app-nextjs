import { Metadata } from "next"
import { Shell } from "@/components/shell"
import { MeetingCalendar } from "@/components/meetings/meeting-calendar"
import { MeetingList } from "@/components/meetings/meeting-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Meetings",
  description: "Schedule and manage team meetings",
}

export default function MeetingsPage() {
  return (
    <Shell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
        </div>
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="space-y-4">
            <MeetingCalendar />
          </TabsContent>
          <TabsContent value="list" className="space-y-4">
            <MeetingList />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  )
}
