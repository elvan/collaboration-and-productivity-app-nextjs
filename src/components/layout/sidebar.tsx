"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { usePersistentState } from "@/hooks/use-persistent-state"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { AnimatePresence, motion } from "framer-motion"
import {
  LayoutDashboard,
  Settings,
  Calendar,
  MessageSquare,
  FolderKanban,
  Users,
  ListTodo,
  BarChart2,
  Bell,
  Layout,
  Clock,
  Briefcase,
  FileText,
  Video,
  Files,
  Book,
  MessageCircle,
  Hash,
  Shield,
  Zap,
  GitBranch,
  GitMerge,
  Plug,
  Terminal,
  ChevronRight,
} from "lucide-react"

interface SidebarNavItem {
  title: string
  href: string
  icon: any
  items?: SidebarNavItem[]
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks/list",
    icon: ListTodo,
    items: [
      {
        title: "List View",
        href: "/dashboard/tasks/list",
        icon: Layout,
      },
      {
        title: "Board View",
        href: "/dashboard/tasks/board",
        icon: Layout,
      },
      {
        title: "Calendar View",
        href: "/dashboard/tasks/calendar",
        icon: Calendar,
      },
      {
        title: "Gantt View",
        href: "/dashboard/tasks/gantt",
        icon: Layout,
      },
      {
        title: "Templates",
        href: "/dashboard/tasks/templates",
        icon: Layout,
      },
      {
        title: "Time Tracking",
        href: "/dashboard/tasks/time",
        icon: Clock,
      },
    ],
  },
  {
    title: "Projects",
    href: "/dashboard/projects/all",
    icon: FolderKanban,
    items: [
      {
        title: "All Projects",
        href: "/dashboard/projects/all",
        icon: Layout,
      },
      {
        title: "Portfolio",
        href: "/dashboard/projects/portfolio",
        icon: Briefcase,
      },
      {
        title: "Templates",
        href: "/dashboard/projects/templates",
        icon: Layout,
      },
      {
        title: "Reports",
        href: "/dashboard/projects/reports",
        icon: FileText,
      },
    ],
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar/schedule",
    icon: Calendar,
    items: [
      {
        title: "Schedule",
        href: "/dashboard/calendar/schedule",
        icon: Calendar,
      },
      {
        title: "Meetings",
        href: "/dashboard/calendar/meetings",
        icon: Video,
      },
      {
        title: "Resources",
        href: "/dashboard/calendar/resources",
        icon: Users,
      },
    ],
  },
  {
    title: "Documents",
    href: "/dashboard/documents/all",
    icon: FileText,
    items: [
      {
        title: "All Documents",
        href: "/dashboard/documents/all",
        icon: Files,
      },
      {
        title: "Templates",
        href: "/dashboard/documents/templates",
        icon: Layout,
      },
      {
        title: "Wiki",
        href: "/dashboard/documents/wiki",
        icon: Book,
      },
    ],
  },
  {
    title: "Messages",
    href: "/dashboard/messages/chat",
    icon: MessageSquare,
    items: [
      {
        title: "Chat",
        href: "/dashboard/messages/chat",
        icon: MessageCircle,
      },
      {
        title: "Channels",
        href: "/dashboard/messages/channels",
        icon: Hash,
      },
      {
        title: "Threads",
        href: "/dashboard/messages/threads",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Team",
    href: "/dashboard/team/members",
    icon: Users,
    items: [
      {
        title: "Members",
        href: "/dashboard/team/members",
        icon: Users,
      },
      {
        title: "Roles",
        href: "/dashboard/team/roles",
        icon: Shield,
      },
      {
        title: "Workload",
        href: "/dashboard/team/workload",
        icon: BarChart2,
      },
    ],
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics/overview",
    icon: BarChart2,
    items: [
      {
        title: "Overview",
        href: "/dashboard/analytics/overview",
        icon: LayoutDashboard,
      },
      {
        title: "Projects",
        href: "/dashboard/analytics/projects",
        icon: FolderKanban,
      },
      {
        title: "Team",
        href: "/dashboard/analytics/team",
        icon: Users,
      },
      {
        title: "Time",
        href: "/dashboard/analytics/time",
        icon: Clock,
      },
      {
        title: "Custom Reports",
        href: "/dashboard/analytics/reports",
        icon: FileText,
      },
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications/overview",
    icon: Bell,
    items: [
      {
        title: "Overview",
        href: "/dashboard/notifications/overview",
        icon: LayoutDashboard,
      },
      {
        title: "Settings",
        href: "/dashboard/notifications/settings",
        icon: Settings,
      },
      {
        title: "Templates",
        href: "/dashboard/notifications/templates",
        icon: Layout,
      },
      {
        title: "Rules",
        href: "/dashboard/notifications/rules",
        icon: GitBranch,
      },
    ],
  },
  {
    title: "Automation",
    href: "/dashboard/automation/rules",
    icon: Zap,
    items: [
      {
        title: "Rules",
        href: "/dashboard/automation/rules",
        icon: GitBranch,
      },
      {
        title: "Workflows",
        href: "/dashboard/automation/workflows",
        icon: GitMerge,
      },
      {
        title: "Integrations",
        href: "/dashboard/automation/integrations",
        icon: Plug,
      },
    ],
  },
  {
    title: "Settings",
    href: "/dashboard/settings/general",
    icon: Settings,
    items: [
      {
        title: "General",
        href: "/dashboard/settings/general",
        icon: Settings,
      },
      {
        title: "Workspace",
        href: "/dashboard/settings/workspace",
        icon: Layout,
      },
      {
        title: "Team",
        href: "/dashboard/settings/team",
        icon: Users,
      },
      {
        title: "Security",
        href: "/dashboard/settings/security",
        icon: Shield,
      },
      {
        title: "API",
        href: "/dashboard/settings/api",
        icon: Terminal,
      },
    ],
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()
  const isHydrated = useIsHydrated()
  const [expandedItems, setExpandedItems] = usePersistentState<string[]>("sidebar-expanded", [])
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    // Auto-expand parent of active item on initial load
    const activeParent = sidebarNavItems.find(item =>
      item.items?.some(subItem => pathname === subItem.href)
    );
    if (activeParent && !expandedItems.includes(activeParent.href)) {
      setExpandedItems([...expandedItems, activeParent.href]);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpanded = (href: string) => {
    setExpandedItems(current =>
      current.includes(href)
        ? current.filter(item => item !== href)
        : [...current, href]
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, sidebarNavItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const item = sidebarNavItems[index];
        if (item.items?.length) {
          toggleExpanded(item.href);
        } else {
          window.location.href = item.href;
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        const currentItem = sidebarNavItems[index];
        if (currentItem.items?.length && !expandedItems.includes(currentItem.href)) {
          toggleExpanded(currentItem.href);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const { item: currentNavItem } = sidebarNavItems[index];
        if (expandedItems.includes(currentNavItem.href)) {
          // If on parent and expanded, collapse it
          toggleExpanded(currentNavItem.href);
        }
        break;
    }
  }

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < itemRefs.current.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const renderNavItem = (item: SidebarNavItem, depth: number = 0, index: number) => {
    const isActive = pathname === item.href
    const hasSubItems = item.items && item.items.length > 0
    const isExpanded = expandedItems.includes(item.href)
    const isParentOfActive = hasSubItems && item.items?.some(
      subItem => pathname === subItem.href || pathname.startsWith(subItem.href + '/')
    )

    const commonClassNames = cn(
      "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring",
      (isActive || isParentOfActive) ? "bg-accent" : "transparent",
      depth > 0 ? "pl-8" : "",
      !isHydrated && "invisible"
    )

    const handleItemClick = (e: React.MouseEvent) => {
      if (hasSubItems) {
        e.preventDefault()
        toggleExpanded(item.href)
      }
    }

    const content = (
      <>
        <div className="flex items-center flex-1">
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
        </div>
        {hasSubItems && (
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded ? "transform rotate-90" : ""
            )}
          />
        )}
      </>
    )

    return (
      <div key={item.href} className="space-y-1">
        <div className={cn(
          "relative",
          !isHydrated && "overflow-hidden"
        )}>
          {!isHydrated && (
            <div className="absolute inset-0 flex items-center px-3">
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              <div className="ml-2 h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          )}
          {hasSubItems ? (
            <button
              ref={el => itemRefs.current[index] = el}
              onClick={handleItemClick}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={commonClassNames}
              role="treeitem"
              aria-expanded={isExpanded}
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              {content}
            </button>
          ) : (
            <Link
              href={item.href}
              ref={el => itemRefs.current[index] = el as any}
              onClick={handleItemClick}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={commonClassNames}
              role="treeitem"
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              {content}
            </Link>
          )}
        </div>
        <AnimatePresence initial={false}>
          {hasSubItems && isExpanded && isHydrated && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pl-4 space-y-1">
                {item.items.map((subItem, subIndex) => 
                  renderNavItem(
                    subItem, 
                    depth + 1, 
                    index + subIndex + 1
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <nav
      className={cn(
        "hidden flex-col md:flex md:w-[220px] lg:w-[240px]",
        className
      )}
      {...props}
      role="tree"
      aria-label="Navigation menu"
    >
      <div className="flex-1 space-y-4">
        <div className="px-3">
          <div className="space-y-1">
            <div className={cn(
              "mb-2 px-4",
              !isHydrated && "flex items-center"
            )}>
              {!isHydrated ? (
                <div className="h-6 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <h2 className="text-xl font-semibold tracking-tight">
                  Overview
                </h2>
              )}
            </div>
            {sidebarNavItems.map((item, index) => 
              renderNavItem(item, 0, index)
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
