"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  User,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (isAuthPage) return null

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 items-center justify-between'>
        <div className='flex items-center'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <span className='font-bold'>CollabSpace</span>
          </Link>
          <nav className='hidden md:flex items-center space-x-6 text-sm font-medium'>
            {session?.user ? (
              <>
                <Link
                  href='/dashboard'
                  className='flex items-center transition-colors hover:text-foreground/80'
                >
                  <LayoutDashboard className='mr-2 h-4 w-4' />
                  Dashboard
                </Link>
                <Link
                  href='/dashboard/tasks/list'
                  className='transition-colors hover:text-foreground/80'
                >
                  Tasks
                </Link>
                <Link
                  href='/dashboard/projects/all'
                  className='transition-colors hover:text-foreground/80'
                >
                  Projects
                </Link>
                <Link
                  href='/dashboard/calendar/schedule'
                  className='transition-colors hover:text-foreground/80'
                >
                  Calendar
                </Link>
                <Link
                  href='/dashboard/documents/all'
                  className='transition-colors hover:text-foreground/80'
                >
                  Documents
                </Link>
                <Link
                  href='/dashboard/messages/chat'
                  className='transition-colors hover:text-foreground/80'
                >
                  Messages
                </Link>
              </>
            ) : (
              <>
                <Link
                  href='/login'
                  className='transition-colors hover:text-foreground/80'
                >
                  Login
                </Link>
                <Link
                  href='/register'
                  className='transition-colors hover:text-foreground/80'
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className='flex items-center space-x-4'>
          <ThemeToggle />

          {session?.user && (
            <>
              <Button variant='ghost' size='icon' className='relative' asChild>
                <Link href='/dashboard/notifications'>
                  <Bell className='h-5 w-5' />
                  <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground'>
                    2
                  </span>
                </Link>
              </Button>
              <Button variant='ghost' size='icon' className='relative' asChild>
                <Link href='/dashboard/messages'>
                  <MessageSquare className='h-5 w-5' />
                  <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground'>
                    3
                  </span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-8 w-8 rounded-full'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarImage
                        src={session.user.image || ''}
                        alt={session.user.name || ''}
                      />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {session.user.name}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href='/dashboard'>
                        <LayoutDashboard className='mr-2 h-4 w-4' />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href='/dashboard/settings'>
                        <Settings className='mr-2 h-4 w-4' />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className='text-red-600 focus:bg-red-50 focus:text-red-600'
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className='mr-2 h-4 w-4' />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
