"use client"

import { useState } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  History,
  Users,
  Folder,
} from "lucide-react"
import { DocumentDialog } from "./document-dialog"
import { cn } from "@/lib/utils"

interface Document {
  id: string
  title: string
  content: string
  currentVersion: number
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  lastUpdatedBy?: {
    id: string
    name: string
    email: string
    image?: string | null
  } | null
  folder?: {
    id: string
    name: string
  } | null
  template?: {
    id: string
    title: string
  } | null
  collaborators: Array<{
    id: string
    name: string
    email: string
    image?: string | null
  }>
}

interface DocumentListProps {
  documents: Document[]
  onDelete: (id: string) => Promise<void>
  onDuplicate: (id: string) => Promise<void>
  onMove: (id: string, folderId: string) => Promise<void>
  folders: Array<{ id: string; name: string }>
  currentFolder?: { id: string; name: string }
}

export function DocumentList({
  documents,
  onDelete,
  onDuplicate,
  onMove,
  folders,
  currentFolder,
}: DocumentListProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Collaborators</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/documents/${document.id}`}
                      className="font-medium hover:underline"
                    >
                      {document.title}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Version {document.currentVersion}</span>
                      {document.template && (
                        <Badge variant="secondary" className="text-xs">
                          {document.template.title}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {document.folder ? (
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span>{document.folder.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Root</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">
                      {format(new Date(document.updatedAt), "MMM d, yyyy")}
                    </span>
                    {document.lastUpdatedBy && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={document.lastUpdatedBy.image || ""}
                            alt={document.lastUpdatedBy.name}
                          />
                          <AvatarFallback>
                            {document.lastUpdatedBy.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {document.lastUpdatedBy.name}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {document.collaborators.slice(0, 3).map((collaborator) => (
                      <Avatar
                        key={collaborator.id}
                        className="h-6 w-6 border-2 border-background"
                      >
                        <AvatarImage
                          src={collaborator.image || ""}
                          alt={collaborator.name}
                        />
                        <AvatarFallback>
                          {collaborator.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {document.collaborators.length > 3 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                        +{document.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setSelectedDocument(document)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDuplicate(document.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                      >
                        <Link href={`/documents/${document.id}/history`}>
                          <History className="mr-2 h-4 w-4" />
                          Version History
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                      >
                        <Link href={`/documents/${document.id}/share`}>
                          <Users className="mr-2 h-4 w-4" />
                          Share
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(document.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedDocument && (
        <DocumentDialog
          open={!!selectedDocument}
          onOpenChange={() => setSelectedDocument(null)}
          document={selectedDocument}
          folders={folders}
          currentFolder={currentFolder}
        />
      )}
    </>
  )
}
