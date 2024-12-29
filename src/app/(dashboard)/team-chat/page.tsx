import { Metadata } from "next"
import { Shell } from "@/components/shell"
import { ChatInterface } from "@/components/team-chat/chat-interface"

export const metadata: Metadata = {
  title: "Team Chat",
  description: "Real-time team communication",
}

export default function TeamChatPage() {
  return (
    <Shell>
      <div className="flex-1 flex">
        <ChatInterface />
      </div>
    </Shell>
  )
}
