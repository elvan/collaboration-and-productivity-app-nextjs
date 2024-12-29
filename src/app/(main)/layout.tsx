import { Header } from "@/components/layout/header"
import { MainNav } from '@/components/layout/main-nav';
import { cn } from '@/lib/utils';
import Link from "next/link"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className='relative flex min-h-screen flex-col'>
      <div className='border-b'>
        <div className='flex h-16 items-center px-4'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <span className='text-xl font-bold'>CollabSpace</span>
          </Link>
          <div className='flex flex-1'>
            <Header />
          </div>
        </div>
      </div>
      <div className='flex flex-1'>
        <main className='flex-1 overflow-y-auto'>
          <div className='flex min-h-screen'>
            {/* Sidebar */}
            <div className='hidden border-r bg-background lg:block lg:w-60'>
              <div className='flex h-full flex-col gap-2'>
                <div className='flex-1 overflow-auto py-2'>
                  <MainNav />
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className='flex-1'>
              <div className='h-full px-4 py-6 lg:px-8'>
                <div className='mx-auto max-w-6xl'>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
