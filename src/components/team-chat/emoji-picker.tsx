"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const EMOJI_CATEGORIES = {
  smileys: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃"],
  gestures: ["👋", "🤚", "✋", "🖐️", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟"],
  hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔", "❤️‍🔥"],
  objects: ["💻", "📱", "⌚", "📷", "🎮", "🎧", "📚", "✏️", "📎", "🔑", "💡"],
  symbols: ["✨", "🎵", "💯", "✅", "❌", "❓", "❗", "💤", "💫", "🕐", "🔄"],
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <Card className="w-[320px]">
      <Tabs defaultValue="smileys">
        <TabsList className="w-full">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <TabsTrigger key={category} value={category} className="flex-1">
              {EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES][0]}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
          <TabsContent key={category} value={category}>
            <ScrollArea className="h-[200px] p-4">
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onEmojiSelect(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}
