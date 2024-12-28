"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-2xl">CollabSpace</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {!session?.user && (
            <>
              <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
                Features
              </Link>
              <Link className="text-sm font-medium hover:underline underline-offset-4" href="#testimonials">
                Testimonials
              </Link>
              <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
                Pricing
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Transform Your Team&apos;s Collaboration
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Streamline your workflow, enhance productivity, and bring your team together with our powerful collaboration platform.
                </p>
              </div>
              <div className="space-x-4">
                {session?.user ? (
                  <Link href="/dashboard">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {!session?.user && (
          <>
            {/* Features Section */}
            <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
              <div className="container px-4 md:px-6">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Real-time Collaboration</h3>
                    <p className="text-gray-500 dark:text-gray-400">Work together seamlessly with your team in real-time.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Smart Task Management</h3>
                    <p className="text-gray-500 dark:text-gray-400">Organize and track tasks with intelligent workflows.</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Document Sharing</h3>
                    <p className="text-gray-500 dark:text-gray-400">Share and collaborate on documents with version control.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">What Our Users Say</h2>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <p className="text-gray-500 dark:text-gray-400">&quot;CollabSpace has transformed how our team works together. It&apos;s intuitive and powerful.&quot;</p>
                    <p className="font-semibold">Sarah Johnson, CTO</p>
                  </div>
                  <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <p className="text-gray-500 dark:text-gray-400">&quot;The best collaboration tool we&apos;ve used. It&apos;s helped us streamline our entire workflow.&quot;</p>
                    <p className="font-semibold">Mike Chen, Product Manager</p>
                  </div>
                  <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <p className="text-gray-500 dark:text-gray-400">&quot;Simple yet powerful. CollabSpace has everything we need to manage our projects effectively.&quot;</p>
                    <p className="font-semibold">Emily Davis, Team Lead</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
              <div className="container px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Simple, Transparent Pricing</h2>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold mb-4">Starter</h3>
                    <p className="text-4xl font-bold mb-6">$0</p>
                    <ul className="space-y-2 mb-6">
                      <li>Up to 5 team members</li>
                      <li>Basic collaboration tools</li>
                      <li>2GB storage</li>
                    </ul>
                    <Link href="/register" className="mt-auto">
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </div>
                  <div className="flex flex-col p-6 bg-primary text-primary-foreground rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold mb-4">Pro</h3>
                    <p className="text-4xl font-bold mb-6">$10</p>
                    <ul className="space-y-2 mb-6">
                      <li>Up to 20 team members</li>
                      <li>Advanced collaboration</li>
                      <li>20GB storage</li>
                    </ul>
                    <Link href="/register" className="mt-auto">
                      <Button className="w-full bg-white text-primary hover:bg-white/90">Get Started</Button>
                    </Link>
                  </div>
                  <div className="flex flex-col p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
                    <p className="text-4xl font-bold mb-6">Custom</p>
                    <ul className="space-y-2 mb-6">
                      <li>Unlimited team members</li>
                      <li>Custom solutions</li>
                      <li>Unlimited storage</li>
                    </ul>
                    <Link href="/register" className="mt-auto">
                      <Button className="w-full">Contact Us</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400"> 2024 CollabSpace. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
