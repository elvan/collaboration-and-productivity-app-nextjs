import { useState } from "react"
import Link from "next/link"
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FolderDialog } from "./folder-dialog"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderTree,
  Folder,
  File,
  MoveRight,
} from "lucide-react"

interface FolderPath {
  id: string
  name: string
}

interface FolderItem {
  id: string
  name: string
  description?: string | null
  createdAt: Date
  createdBy: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  _count: {
    documents: number
    children: number
  }
}

interface DocumentItem {
  id: string
  title: string
  createdAt: Date
  createdBy: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface FolderBrowserProps {
  currentFolder?: FolderItem | null
  folders: FolderItem[]
  documents: DocumentItem[]
  folderPath: FolderPath[]
  onCreateFolder: (data: { name: string; description?: string }) => Promise<void>
  onUpdateFolder: (id: string, data: { name: string; description?: string }) => Promise<void>
  onDeleteFolder: (id: string) => Promise<void>
  onMoveFolder: (id: string, targetId: string | null) => Promise<void>
  onMoveDocument: (id: string, targetId: string | null) => Promise<void>
  currentUserId: string
}

export function FolderBrowser({
  currentFolder,
  folders,
  documents,
  folderPath,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveFolder,
  onMoveDocument,
  currentUserId,
}: FolderBrowserProps) {
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null)
  const [selectedItems, setSelectedItems] = useState<Array<{ type: "folder" | "document"; id: string }>>([])

  const handleMove = async (targetId: string | null) => {
    await Promise.all(
      selectedItems.map((item) =>
        item.type === "folder"
          ? onMoveFolder(item.id, targetId)
          : onMoveDocument(item.id, targetId)
      )
    )
    setSelectedItems([])
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/folders" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Root
          </BreadcrumbLink>
        </BreadcrumbItem>
        {folderPath.map((folder) => (
          <BreadcrumbItem key={folder.id}>
            <BreadcrumbLink href={`/folders/${folder.id}`}>
              {folder.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedFolder({})}
          >
            <Folder className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          {selectedItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoveRight className="mr-2 h-4 w-4" />
                  Move ({selectedItems.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleMove(null)}>
                  <FolderTree className="mr-2 h-4 w-4" />
                  Move to Root
                </DropdownMenuItem>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => handleMove(folder.id)}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    Move to {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {folders.map((folder) => (
              <TableRow key={folder.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/folders/${folder.id}`}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <Folder className="h-4 w-4" />
                      {folder.name}
                    </Link>
                    {folder.description && (
                      <span className="text-sm text-muted-foreground">
                        {folder.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span>{folder._count.documents} documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span>{folder._count.children} folders</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={folder.createdBy.image || ""}
                        alt={folder.createdBy.name}
                      />
                      <AvatarFallback>
                        {folder.createdBy.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {folder.createdBy.name}
                    </span>
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
                        onClick={() => setSelectedFolder(folder)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDeleteFolder(folder.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/documents/${document.id}`}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <File className="h-4 w-4" />
                      {document.title}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>Document</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={document.createdBy.image || ""}
                        alt={document.createdBy.name}
                      />
                      <AvatarFallback>
                        {document.createdBy.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {document.createdBy.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedItems.some(
                      (item) => item.type === "document" && item.id === document.id
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([
                          ...selectedItems,
                          { type: "document", id: document.id },
                        ])
                      } else {
                        setSelectedItems(
                          selectedItems.filter(
                            (item) =>
                              !(item.type === "document" && item.id === document.id)
                          )
                        )
                      }
                    }}
                    className="h-4 w-4"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedFolder && (
        <FolderDialog
          open={!!selectedFolder}
          onOpenChange={() => setSelectedFolder(null)}
          folder={selectedFolder}
          onSubmit={selectedFolder.id ? onUpdateFolder : onCreateFolder}
        />
      )}
    </div>
  )
}
