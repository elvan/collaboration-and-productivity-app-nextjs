"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { debounce } from "lodash"
import { Project, ProjectFolder, User, WorkspaceRole } from "@prisma/client"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  Filter,
  Folder,
  Search,
  User as UserIcon,
  X,
} from "lucide-react"

interface ProjectWithDetails extends Project {
  folder: ProjectFolder | null
  owner: Pick<User, "id" | "name" | "email" | "image">
  team: WorkspaceRole | null
}

interface ProjectSearchProps {
  workspaceId: string
  folders: ProjectFolder[]
  teams: WorkspaceRole[]
  initialProjects: ProjectWithDetails[]
}

export function ProjectSearch({
  workspaceId,
  folders,
  teams,
  initialProjects,
}: ProjectSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [projects, setProjects] = useState<ProjectWithDetails[]>(initialProjects)
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [selectedVisibility, setSelectedVisibility] = useState<string>("")
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">()

  // Create URL with search params
  const createQueryString = useCallback(
    (params: Record<string, string | undefined>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, value)
        }
      })

      return newSearchParams.toString()
    },
    [searchParams]
  )

  // Update URL when filters change
  useEffect(() => {
    startTransition(() => {
      const queryString = createQueryString({
        search,
        folder: selectedFolder,
        team: selectedTeam,
        visibility: selectedVisibility,
        date: dateRange,
      })
      router.push(`${pathname}?${queryString}`)
    })
  }, [search, selectedFolder, selectedTeam, selectedVisibility, dateRange])

  // Fetch filtered projects
  const fetchProjects = useCallback(
    debounce(async () => {
      try {
        const queryString = createQueryString({
          search,
          folder: selectedFolder,
          team: selectedTeam,
          visibility: selectedVisibility,
          date: dateRange,
        })

        const response = await fetch(
          `/api/workspaces/${workspaceId}/projects/search?${queryString}`
        )
        if (!response.ok) throw new Error("Failed to fetch projects")

        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error("Failed to fetch projects:", error)
      }
    }, 300),
    [search, selectedFolder, selectedTeam, selectedVisibility, dateRange]
  )

  useEffect(() => {
    fetchProjects()
  }, [search, selectedFolder, selectedTeam, selectedVisibility, dateRange])

  const clearFilters = () => {
    setSearch("")
    setSelectedFolder("")
    setSelectedTeam("")
    setSelectedVisibility("")
    setDateRange(undefined)
  }

  const activeFilters = [
    selectedFolder && folders.find((f) => f.id === selectedFolder)?.name,
    selectedTeam && teams.find((t) => t.id === selectedTeam)?.name,
    selectedVisibility && selectedVisibility.charAt(0).toUpperCase() + selectedVisibility.slice(1),
    dateRange && `Last ${dateRange}`,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All folders</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All teams</SelectItem>
              {teams
                .filter((role) => role.type === "TEAM")
                .map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedVisibility}
            onValueChange={setSelectedVisibility}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All visibilities</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All time</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="month">Last month</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>

          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary">
              {filter}
            </Badge>
          ))}
        </div>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput
            placeholder="Search all projects..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup heading="Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => {
                    router.push(
                      `/workspace/${workspaceId}/project/${project.id}/board`
                    )
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2">
                    {project.folder ? (
                      <Folder className="h-4 w-4" />
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                    <span>{project.name}</span>
                    {project.team && (
                      <Badge variant="secondary">{project.team.name}</Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects found</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Found {projects.length} project
              {projects.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
