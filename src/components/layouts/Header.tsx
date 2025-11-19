'use client'

import { Menu, Bell, User, LogOut } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const { toggleMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 hover:bg-muted rounded-md"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden md:block" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="p-2 hover:bg-muted rounded-md relative">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full" />
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2 ml-2">
            <button className="p-2 hover:bg-muted rounded-md">
              <User className="h-5 w-5 text-foreground" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-md"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

