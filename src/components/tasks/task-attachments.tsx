import { useState } from "react"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Download,
  File,
  FileImage,
  FileText,
  FileVideo,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react"
import { formatBytes } from "@/lib/utils"

interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  createdAt: Date
  uploader: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface TaskAttachmentsProps {
  taskId: string
  attachments: Attachment[]
  onAddAttachment: (file: File) => Promise<void>
  onDeleteAttachment: (attachmentId: string) => Promise<void>
}

export function TaskAttachments({
  taskId,
  attachments,
  onAddAttachment,
  onDeleteAttachment,
}: TaskAttachmentsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useState<HTMLInputElement | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      await onAddAttachment(file)
    } catch (error) {
      console.error("Failed to upload file:", error)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      setIsLoading(true)
      await onDeleteAttachment(attachmentId)
    } catch (error) {
      console.error("Failed to delete attachment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return FileImage
    if (type.startsWith("video/")) return FileVideo
    if (type.startsWith("text/")) return FileText
    return File
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>
              Upload and manage files related to this task
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              className="hidden"
              ref={(ref) => (fileInputRef.current = ref)}
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-8 w-8" />
              <span>No attachments</span>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.type)
                return (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                        <FileIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{attachment.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatBytes(attachment.size)}</span>
                          <span>•</span>
                          <span>
                            {format(
                              new Date(attachment.createdAt),
                              "MMM d, yyyy"
                            )}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage
                                src={attachment.uploader.image || ""}
                                alt={attachment.uploader.name}
                              />
                              <AvatarFallback>
                                {attachment.uploader.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span>{attachment.uploader.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a href={attachment.url} download={attachment.name}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Attachment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The file will be
                              permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteAttachment(attachment.id)
                              }
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
