"use client"

import { useCallback, useEffect, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import * as Y from "yjs"
import { WebrtcProvider } from "y-webrtc"
import { Button } from "@/components/ui/button"
import { Toolbar } from "@/components/ui/toolbar"
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Code,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EditorProps {
  content: string
  documentId: string
  onChange?: (content: string) => void
  currentUser: {
    id: string
    name: string
    color?: string
  }
  readOnly?: boolean
  className?: string
}

export function DocumentEditor({
  content,
  documentId,
  onChange,
  currentUser,
  readOnly = false,
  className,
}: EditorProps) {
  const [provider, setProvider] = useState<WebrtcProvider | null>(null)

  // Initialize Yjs document and provider
  useEffect(() => {
    const ydoc = new Y.Doc()
    const webrtcProvider = new WebrtcProvider(
      `document-${documentId}`,
      ydoc,
      { signaling: ["wss://signaling.example.com"] } // Replace with your signaling server
    )

    webrtcProvider.awareness.setLocalStateField("user", {
      name: currentUser.name,
      color: currentUser.color || "#" + Math.floor(Math.random()*16777215).toString(16),
    })

    setProvider(webrtcProvider)

    return () => {
      webrtcProvider.destroy()
    }
  }, [documentId, currentUser])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: provider?.doc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: currentUser.name,
          color: currentUser.color,
        },
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run()
  }, [editor])

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run()
  }, [editor])

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run()
  }, [editor])

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run()
  }, [editor])

  const toggleCodeBlock = useCallback(() => {
    editor?.chain().focus().toggleCodeBlock().run()
  }, [editor])

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run()
  }, [editor])

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {!readOnly && (
        <Toolbar className="border-b p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-[1px] bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBold}
            className={cn(editor.isActive("bold") && "bg-accent")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleItalic}
            className={cn(editor.isActive("italic") && "bg-accent")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleStrike}
            className={cn(editor.isActive("strike") && "bg-accent")}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <div className="w-[1px] bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBulletList}
            className={cn(editor.isActive("bulletList") && "bg-accent")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleOrderedList}
            className={cn(editor.isActive("orderedList") && "bg-accent")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-[1px] bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBlockquote}
            className={cn(editor.isActive("blockquote") && "bg-accent")}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCodeBlock}
            className={cn(editor.isActive("codeBlock") && "bg-accent")}
          >
            <Code className="h-4 w-4" />
          </Button>
        </Toolbar>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none dark:prose-invert",
          "focus:outline-none",
          readOnly && "pointer-events-none opacity-60"
        )}
      />
    </div>
  )
}
