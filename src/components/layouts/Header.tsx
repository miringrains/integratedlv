'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Bell, User, LogOut } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  ticket_id: string
  ticket_number: string
  title: string
  created_at: string
  priority: string
}

export function Header() {
  const { toggleMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    loadProfile()
    loadNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => clearInterval(interval)
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

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get recent tickets created in the last 24 hours
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    const { data } = await supabase
      .from('care_log_tickets')
      .select('id, ticket_number, title, created_at, priority')
      .gte('created_at', oneDayAgo.toISOString())
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data as Notification[])
      // Count urgent tickets as unread
      const urgentCount = data.filter(t => t.priority === 'urgent').length
      setUnreadCount(urgentCount)
    }
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
          {/* Notifications Dropdown */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-md relative transition-colors group">
                <Bell className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-semibold">Recent Activity</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No recent notifications
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} asChild>
                      <Link 
                        href={`/tickets/${notif.id}`}
                        className="flex flex-col gap-1 p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => setShowNotifications(false)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {notif.ticket_number}
                          </span>
                          {notif.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                              URGENT
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/tickets" className="text-center text-sm text-primary font-semibold cursor-pointer">
                  View All Tickets →
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
