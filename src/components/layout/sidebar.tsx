"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  BarChart2,
  Bell,
  Settings,
  Zap,
  Search,
  Book,
  Video,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const projectLinks = [
  {
    title: "All Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Portfolio",
    href: "/projects?view=portfolio",
    icon: LayoutDashboard,
  },
  {
    title: "Templates",
    href: "/projects/templates",
    icon: FileText,
  },
  {
    title: "Reports",
    href: "/projects/reports",
    icon: BarChart2,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-2">
      {/* Core Work Management */}
      <div className="space-y-2">
        <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight">
          Work Management
        </h2>
        <nav className="grid gap-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/dashboard" ? "bg-accent" : "transparent"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/tasks"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/tasks" ? "bg-accent" : "transparent"
            )}
          >
            <CheckSquare className="h-4 w-4" />
            Tasks
          </Link>

          <Accordion type="single" collapsible defaultValue="projects">
            <AccordionItem value="projects" className="border-none">
              <AccordionTrigger
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground no-underline hover:no-underline",
                  pathname.startsWith("/projects") ? "bg-accent" : "transparent"
                )}
              >
                <FolderKanban className="h-4 w-4" />
                <span className="flex-1 text-left">Projects</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-1 pl-6">
                  {projectLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        pathname === link.href ? "bg-accent" : "transparent"
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.title}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Link
            href="/calendar"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/calendar" ? "bg-accent" : "transparent"
            )}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Link>
          <Link
            href="/meetings"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/meetings" ? "bg-accent" : "transparent"
            )}
          >
            <Video className="h-4 w-4" />
            Meetings
          </Link>
        </nav>
      </div>

      {/* Content & Communication */}
      <div className="mt-4 space-y-2">
        <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight">
          Content & Communication
        </h2>
        <nav className="grid gap-1">
          <Link
            href="/documents"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/documents" ? "bg-accent" : "transparent"
            )}
          >
            <FileText className="h-4 w-4" />
            Documents
          </Link>
          <Link
            href="/knowledge-base"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/knowledge-base" ? "bg-accent" : "transparent"
            )}
          >
            <Book className="h-4 w-4" />
            Knowledge Base
          </Link>
          <Link
            href="/team-chat"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/team-chat" ? "bg-accent" : "transparent"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Team Chat
          </Link>
        </nav>
      </div>

      {/* Team & Workspace */}
      <div className="mt-4 space-y-2">
        <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight">
          Team & Workspace
        </h2>
        <nav className="grid gap-1">
          <Link
            href="/search"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/search" ? "bg-accent" : "transparent"
            )}
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          <Link
            href="/workspaces"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/workspaces" ? "bg-accent" : "transparent"
            )}
          >
            <FolderKanban className="h-4 w-4" />
            Workspaces
          </Link>
          <Link
            href="/team"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/team" ? "bg-accent" : "transparent"
            )}
          >
            <Users className="h-4 w-4" />
            Team
          </Link>
          <Link
            href="/workspaces?view=analytics"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/workspaces" && new URLSearchParams(pathname).get("view") === "analytics" ? "bg-accent" : "transparent"
            )}
          >
            <BarChart2 className="h-4 w-4" />
            Analytics
          </Link>
        </nav>
      </div>

      {/* Settings & System */}
      <div className="mt-4 space-y-2">
        <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight">
          Settings & System
        </h2>
        <nav className="grid gap-1">
          <Link
            href="/notifications"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/notifications" ? "bg-accent" : "transparent"
            )}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </Link>
          <Link
            href="/automation"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/automation" ? "bg-accent" : "transparent"
            )}
          >
            <Zap className="h-4 w-4" />
            Automation
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === "/settings" ? "bg-accent" : "transparent"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </div>
    </div>
  )
}
