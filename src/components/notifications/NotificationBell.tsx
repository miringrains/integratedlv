'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  ticket?: {
    id: string
    ticket_number: string
    title: string
    status: string
    priority: string
  }
  related_user?: {
    id: string
    first_name: string
    last_name: string
  }
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications()
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?unread_only=false')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data || [])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notification_ids: [notification.id] }),
        })
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }

    // Navigate to ticket if applicable
    if (notification.ticket?.id) {
      router.push(`/tickets/${notification.ticket.id}`)
      setShowNotifications(false)
    }
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket_assigned':
        return '🎯'
      case 'ticket_comment':
        return '💬'
      case 'ticket_status_changed':
        return '📝'
      case 'ticket_priority_changed':
        return '⚠️'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string, priority?: string) => {
    if (priority === 'urgent') return 'text-red-600'
    if (type === 'ticket_assigned') return 'text-accent'
    if (type === 'ticket_comment') return 'text-primary'
    return 'text-muted-foreground'
  }

  const unreadNotifications = notifications.filter(n => !n.is_read)
  const readNotifications = notifications.filter(n => n.is_read).slice(0, 5)

  return (
    <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-muted rounded-md relative transition-colors group">
          <Bell className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="text-sm font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={loading}
              className="h-7 text-xs"
            >
              {loading ? 'Marking...' : 'Mark all read'}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {/* Unread Notifications */}
            {unreadNotifications.length > 0 && (
              <>
                {unreadNotifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="p-0 cursor-pointer"
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="w-full p-3 hover:bg-accent hover:text-white transition-colors group">
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">{getNotificationIcon(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-semibold ${getNotificationColor(notif.type, notif.ticket?.priority)} group-hover:text-white`}>
                              {notif.title}
                            </p>
                            {notif.ticket?.priority === 'urgent' && (
                              <Badge className="bg-red-600 text-white text-[10px] h-4 px-1.5">
                                URGENT
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs opacity-90 group-hover:opacity-100 line-clamp-2 mb-1">
                            {notif.message}
                          </p>
                          {notif.ticket && (
                            <p className="text-xs opacity-70 group-hover:opacity-90 font-mono">
                              {notif.ticket.ticket_number}
                            </p>
                          )}
                          <p className="text-xs opacity-70 group-hover:opacity-90 mt-1">
                            {formatDateTime(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                {readNotifications.length > 0 && <DropdownMenuSeparator />}
              </>
            )}

            {/* Read Notifications (recent) */}
            {readNotifications.length > 0 && (
              <>
                {readNotifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="p-0 cursor-pointer opacity-60"
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="w-full p-3 hover:bg-muted transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 opacity-50">{getNotificationIcon(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1 mb-1">
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </>
        )}
        
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link 
            href="/tickets" 
            className="block text-center text-sm text-primary hover:underline font-medium py-2"
            onClick={() => setShowNotifications(false)}
          >
            View All Tickets →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

