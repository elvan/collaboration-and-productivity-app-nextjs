"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { FolderTemplate, TemplateVersion, User } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  History,
  Clock,
  RotateCcw,
  ChevronRight,
  GitCompare,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TemplateVersionHistoryProps {
  workspaceId: string
  template: FolderTemplate & {
    versions: (TemplateVersion & {
      createdBy: Pick<User, "id" | "name" | "email" | "image">
    })[]
  }
}

export function TemplateVersionHistory({
  workspaceId,
  template,
}: TemplateVersionHistoryProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [compareMode, setCompareMode] = useState(false)
  const [showDiff, setShowDiff] = useState(false)

  async function handleRollback(versionId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${template.id}/versions/${versionId}/rollback`,
        {
          method: "POST",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to rollback version")
      }

      toast({
        title: "Success",
        description: "Template rolled back successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rollback template version",
        variant: "destructive",
      })
    }
  }

  function toggleVersionSelection(versionId: string) {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter((id) => id !== versionId))
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId])
    }
  }

  function compareVersions() {
    if (selectedVersions.length !== 2) return

    const version1 = template.versions.find((v) => v.id === selectedVersions[0])
    const version2 = template.versions.find((v) => v.id === selectedVersions[1])

    if (!version1 || !version2) return

    // Compare structures and highlight differences
    const structure1 = JSON.stringify(version1.structure, null, 2)
    const structure2 = JSON.stringify(version2.structure, null, 2)

    return {
      version1,
      version2,
      structure1,
      structure2,
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <History className="h-4 w-4 mr-2" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Template Version History</DialogTitle>
          <DialogDescription>
            View and manage template versions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Current Version</h3>
              <p className="text-sm text-muted-foreground">
                v{template.currentVersion}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              {compareMode ? "Exit Compare" : "Compare Versions"}
            </Button>
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-4">
              {template.versions
                .sort((a, b) => b.version - a.version)
                .map((version) => (
                  <div
                    key={version.id}
                    className={cn(
                      "border rounded-lg p-4 mb-4",
                      version.version === template.currentVersion &&
                        "border-primary",
                      compareMode &&
                        selectedVersions.includes(version.id) &&
                        "border-blue-500"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {compareMode ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleVersionSelection(version.id)}
                            disabled={
                              selectedVersions.length === 2 &&
                              !selectedVersions.includes(version.id)
                            }
                          >
                            {selectedVersions.includes(version.id)
                              ? "Selected"
                              : "Select"}
                          </Button>
                        ) : (
                          <Badge>v{version.version}</Badge>
                        )}
                        <span className="text-sm font-medium">
                          {version.name}
                        </span>
                      </div>
                      {!compareMode && version.version !== template.currentVersion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRollback(version.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rollback
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })}
                      <ChevronRight className="h-4 w-4" />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={version.createdBy.image || ""} />
                        <AvatarFallback>
                          {version.createdBy.name?.[0] ||
                            version.createdBy.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{version.createdBy.name}</span>
                    </div>

                    {version.changelog && (
                      <p className="text-sm text-muted-foreground">
                        {version.changelog}
                      </p>
                    )}

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="structure">
                        <AccordionTrigger className="text-sm">
                          View Structure
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                            {JSON.stringify(version.structure, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                ))}
            </div>
          </ScrollArea>

          {compareMode && selectedVersions.length === 2 && (
            <div className="space-y-4">
              <Button
                className="w-full"
                onClick={() => setShowDiff(!showDiff)}
              >
                {showDiff ? "Hide Comparison" : "Show Comparison"}
              </Button>

              {showDiff && (
                <div className="border rounded-md p-4 space-y-4">
                  <h4 className="text-sm font-medium">Version Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {(() => {
                      const comparison = compareVersions()
                      if (!comparison) return null

                      return (
                        <>
                          <div>
                            <Badge className="mb-2">
                              v{comparison.version1.version}
                            </Badge>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                              {comparison.structure1}
                            </pre>
                          </div>
                          <div>
                            <Badge className="mb-2">
                              v{comparison.version2.version}
                            </Badge>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                              {comparison.structure2}
                            </pre>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
