'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Bell, User, LogOut } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const { toggleMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    setProfile(data)
  }

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
          className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden md:block" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="p-2 hover:bg-muted rounded-md relative transition-colors">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full" />
          </button>

          {/* User Avatar Menu */}
          <Link href="/settings" className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-lg transition-colors group">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full border-2 border-gray-200 bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}` : 'U'
              )}
            </div>
            {/* Name (desktop only) */}
            <div className="hidden md:block text-sm">
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
          </Link>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}

