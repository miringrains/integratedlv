'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, User, LogOut } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/notifications/NotificationBell'

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
    <header className="bg-card border-b border-border sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-8 py-3 gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>

        {/* Workspace Selector for Platform Admin */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          <div id="workspace-selector-mount" />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <NotificationBell />

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
