'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { useAdminAccess } from "@/hooks/use-admin-access"
import { AnimatePresence, motion } from 'framer-motion';
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
} from 'lucide-react';

interface SidebarNavItem {
  title: string;
  href: string;
  icon: any;
  items?: SidebarNavItem[];
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Tasks',
    href: '/tasks/list',
    icon: ListTodo,
    items: [
      {
        title: 'List View',
        href: '/tasks/list',
        icon: Layout,
      },
      {
        title: 'Board View',
        href: '/tasks/board',
        icon: Layout,
      },
      {
        title: 'Calendar View',
        href: '/tasks/calendar',
        icon: Calendar,
      },
      {
        title: 'Gantt View',
        href: '/tasks/gantt',
        icon: Layout,
      },
      {
        title: 'Templates',
        href: '/tasks/templates',
        icon: Layout,
      },
      {
        title: 'Time Tracking',
        href: '/tasks/time',
        icon: Clock,
      },
      {
        title: 'Views',
        href: '/tasks/views',
        icon: Layout,
        items: [
          {
            title: 'Settings',
            href: '/tasks/views/settings',
            icon: Settings,
          },
        ],
      },
    ],
  },
  {
    title: 'Projects',
    href: '/projects/all',
    icon: FolderKanban,
    items: [
      {
        title: 'All Projects',
        href: '/projects/all',
        icon: Layout,
      },
      {
        title: 'Portfolio',
        href: '/projects/portfolio',
        icon: Briefcase,
      },
      {
        title: 'Templates',
        href: '/projects/templates',
        icon: Layout,
      },
      {
        title: 'Reports',
        href: '/projects/reports',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Calendar',
    href: '/calendar/schedule',
    icon: Calendar,
    items: [
      {
        title: 'Schedule',
        href: '/calendar/schedule',
        icon: Calendar,
      },
      {
        title: 'Meetings',
        href: '/calendar/meetings',
        icon: Video,
      },
      {
        title: 'Resources',
        href: '/calendar/resources',
        icon: Users,
      },
    ],
  },
  {
    title: 'Documents',
    href: '/documents/all',
    icon: FileText,
    items: [
      {
        title: 'All Documents',
        href: '/documents/all',
        icon: Files,
      },
      {
        title: 'Templates',
        href: '/documents/templates',
        icon: Layout,
      },
      {
        title: 'Wiki',
        href: '/documents/wiki',
        icon: Book,
      },
    ],
  },
  {
    title: 'Messages',
    href: '/messages/chat',
    icon: MessageSquare,
    items: [
      {
        title: 'Chat',
        href: '/messages/chat',
        icon: MessageCircle,
      },
      {
        title: 'Channels',
        href: '/messages/channels',
        icon: Hash,
      },
      {
        title: 'Threads',
        href: '/messages/threads',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'Team',
    href: '/team/members',
    icon: Users,
    items: [
      {
        title: 'Members',
        href: '/team/members',
        icon: Users,
      },
      {
        title: 'Roles',
        href: '/team/roles',
        icon: Shield,
      },
      {
        title: 'Workload',
        href: '/team/workload',
        icon: BarChart2,
      },
    ],
  },
  {
    title: 'Analytics',
    href: '/analytics/overview',
    icon: BarChart2,
    items: [
      {
        title: 'Overview',
        href: '/analytics/overview',
        icon: LayoutDashboard,
      },
      {
        title: 'Projects',
        href: '/analytics/projects',
        icon: FolderKanban,
      },
      {
        title: 'Team',
        href: '/analytics/team',
        icon: Users,
      },
      {
        title: 'Time',
        href: '/analytics/time',
        icon: Clock,
      },
      {
        title: 'Custom Reports',
        href: '/analytics/reports',
        icon: FileText,
      },
      {
        title: 'Notification Delivery',
        href: '/analytics/notification-delivery',
        icon: Bell,
      },
    ],
  },
  {
    title: 'Notifications',
    href: '/notifications/overview',
    icon: Bell,
    items: [
      {
        title: 'Overview',
        href: '/notifications/overview',
        icon: LayoutDashboard,
      },
      {
        title: 'Settings',
        href: '/notifications/settings',
        icon: Settings,
      },
      {
        title: 'Templates',
        href: '/notifications/templates',
        icon: Layout,
        items: [
          {
            title: 'Analytics',
            href: '/notifications/templates/analytics',
            icon: BarChart2,
          },
        ],
      },
      {
        title: 'Rules',
        href: '/notifications/rules',
        icon: GitBranch,
      },
      {
        title: 'AB Tests',
        href: '/notifications/ab-tests',
        icon: GitBranch,
      },
      {
        title: 'Analytics',
        href: '/notifications/analytics',
        icon: BarChart2,
      },
      {
        title: 'Campaigns',
        href: '/notifications/campaigns',
        icon: MessageSquare,
      },
      {
        title: 'Preferences',
        href: '/notifications/preferences',
        icon: Settings,
      },
    ],
  },
  {
    title: 'Automation',
    href: '/automation/rules',
    icon: Zap,
    items: [
      {
        title: 'Rules',
        href: '/automation/rules',
        icon: GitBranch,
      },
      {
        title: 'Workflows',
        href: '/automation/workflows',
        icon: GitMerge,
      },
      {
        title: 'Integrations',
        href: '/automation/integrations',
        icon: Plug,
      },
    ],
  },
  {
    title: 'Settings',
    href: '/settings/general',
    icon: Settings,
    items: [
      {
        title: 'General',
        href: '/settings/general',
        icon: Settings,
      },
      {
        title: 'Workspace',
        href: '/settings/workspace',
        icon: Layout,
      },
      {
        title: 'Team',
        href: '/settings/team',
        icon: Users,
      },
      {
        title: 'Security',
        href: '/settings/security',
        icon: Shield,
      },
      {
        title: 'API',
        href: '/settings/api',
        icon: Terminal,
      },
      {
        title: 'Notifications',
        href: '/settings/notifications',
        icon: Bell,
      },
    ],
  },
  {
    title: 'Admin',
    icon: Shield,
    href: "/admin",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Roles",
        href: "/admin/roles",
        icon: Shield,
      },
    ],
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();
  const isHydrated = useIsHydrated();
  const hasAdminAccess = useAdminAccess();
  const [expandedItems, setExpandedItems] = usePersistentState<string[]>(
    'sidebar-expanded',
    []
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // Auto-expand parent of active item on initial load
    const activeParent = sidebarNavItems.find((item) =>
      item.items?.some((subItem) => pathname === subItem.href)
    );
    if (activeParent && !expandedItems.includes(activeParent.href)) {
      setExpandedItems([...expandedItems, activeParent.href]);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpanded = (href: string) => {
    setExpandedItems((current) =>
      current.includes(href)
        ? current.filter((item) => item !== href)
        : [...current, href]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          Math.min(prev + 1, sidebarNavItems.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
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
        if (
          currentItem.items?.length &&
          !expandedItems.includes(currentItem.href)
        ) {
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
  };

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < itemRefs.current.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const renderNavItem = (
    item: SidebarNavItem,
    depth: number = 0,
    index: number
  ) => {
    const isActive = pathname === item.href;
    const hasSubItems = item.items && item.items.length > 0;
    const isExpanded = expandedItems.includes(item.href);
    const isParentOfActive =
      hasSubItems &&
      item.items?.some(
        (subItem) =>
          pathname === subItem.href || pathname.startsWith(subItem.href + '/')
      );

    const commonClassNames = cn(
      'w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring',
      isActive || isParentOfActive ? 'bg-accent' : 'transparent',
      depth > 0 ? 'pl-8' : '',
      !isHydrated && 'invisible'
    );

    const handleItemClick = (e: React.MouseEvent) => {
      if (hasSubItems) {
        e.preventDefault();
        toggleExpanded(item.href);
      }
    };

    const content = (
      <>
        <div className='flex items-center flex-1'>
          <item.icon className='mr-2 h-4 w-4' />
          {item.title}
        </div>
        {hasSubItems && (
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isExpanded ? 'transform rotate-90' : ''
            )}
          />
        )}
      </>
    );

    return (
      <div key={item.href} className='space-y-1'>
        <div className={cn('relative', !isHydrated && 'overflow-hidden')}>
          {!isHydrated && (
            <div className='absolute inset-0 flex items-center px-3'>
              <div className='h-4 w-4 animate-pulse rounded bg-muted' />
              <div className='ml-2 h-4 w-24 animate-pulse rounded bg-muted' />
            </div>
          )}
          {hasSubItems ? (
            <button
              ref={(el) => (itemRefs.current[index] = el)}
              onClick={handleItemClick}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={commonClassNames}
              role='treeitem'
              aria-expanded={isExpanded}
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              {content}
            </button>
          ) : (
            <Link
              href={item.href}
              ref={(el) => (itemRefs.current[index] = el as any)}
              onClick={handleItemClick}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={commonClassNames}
              role='treeitem'
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
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className='overflow-hidden'
            >
              <div className='pl-4 space-y-1'>
                {item.items.map((subItem, subIndex) =>
                  renderNavItem(subItem, depth + 1, index + subIndex + 1)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const filteredNavItems = useMemo(() => {
    console.log('Admin access in sidebar:', hasAdminAccess)
    return sidebarNavItems.filter(item => {
      if (item.title === "Admin") {
        return hasAdminAccess
      }
      return true
    })
  }, [hasAdminAccess])

  return (
    <nav
      className={cn(
        "relative h-screen border-r pt-16 flex flex-col bg-background",
        className
      )}
      {...props}
    >
      <div className="flex-1 py-2">
        <div className="px-4 py-2">
          {filteredNavItems.map((item, index) => (
            renderNavItem(item, 0, index)
          ))}
        </div>
      </div>
    </nav>
  );
}
