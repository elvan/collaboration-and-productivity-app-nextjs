"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (isAuthPage) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">CollabSpace</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-foreground/80"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="transition-colors hover:text-foreground/80"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/features"
                  className="transition-colors hover:text-foreground/80"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-foreground/80"
                >
                  Pricing
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {session?.user ? (
              <Button
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
