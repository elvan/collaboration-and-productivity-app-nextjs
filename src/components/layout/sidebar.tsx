"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
    href: "/dashboard/tasks",
    icon: ListTodo,
    items: [
      {
        title: "All Tasks",
        href: "/dashboard/tasks",
        icon: Layout,
      },
      {
        title: "Views",
        href: "/dashboard/tasks/views",
        icon: Layout,
      },
    ],
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart2,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    items: [
      {
        title: "Overview",
        href: "/notifications",
        icon: LayoutDashboard,
      },
      {
        title: "Templates",
        href: "/notifications/templates",
        icon: Layout,
      },
      {
        title: "Campaigns",
        href: "/notifications/campaigns",
        icon: Layout,
      },
      {
        title: "Analytics",
        href: "/notifications/analytics",
        icon: BarChart2,
      },
      {
        title: "A/B Tests",
        href: "/notifications/ab-tests",
        icon: Layout,
      },
      {
        title: "Preferences",
        href: "/notifications/preferences",
        icon: Settings,
      },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()

  const renderNavItem = (item: SidebarNavItem, depth: number = 0) => {
    const isActive = pathname === item.href
    const hasSubItems = item.items && item.items.length > 0
    const isParentOfActive = hasSubItems && item.items?.some(
      subItem => pathname === subItem.href || pathname.startsWith(subItem.href + '/')
    )

    return (
      <div key={item.href} className="space-y-1">
        <Link
          href={item.href}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive || isParentOfActive ? "bg-accent" : "transparent",
            depth > 0 ? "pl-8" : ""
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
        </Link>
        {hasSubItems && (
          <div className="pl-4 space-y-1">
            {item.items.map(subItem => renderNavItem(subItem, depth + 1))}
          </div>
        )}
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
    >
      <div className="flex-1 space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight">
              Overview
            </h2>
            {sidebarNavItems.map(item => renderNavItem(item))}
          </div>
        </div>
      </div>
    </nav>
  )
}
