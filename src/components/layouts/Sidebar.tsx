'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  Home, 
  MapPin, 
  Cpu, 
  FileText, 
  Ticket, 
  Settings, 
  Users,
  X,
  Building2
} from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

interface NavItem {
  href: string
  label: string
  icon: typeof Home
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export function Sidebar() {
  const pathname = usePathname()
  const { isMobileOpen, closeMobile } = useSidebar()
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/user/me')
        if (response.ok) {
          const user = await response.json()
          setIsPlatformAdmin(user.is_platform_admin)
          
          // Check if org admin (simplified logic based on memberships usually returned)
          // Note: simpler check for now, robust check is in server components
          // We assume if not platform admin but has access, they are org admin or employee
          // We can refine if we expose more role info in /api/user/me
          
          // For UI purposes:
          // If platform admin -> show platform nav
          // If not -> show standard nav (we can distinguish org admin vs employee if needed)
          // For now, let's assume org admin for non-platform to show basic items
          setIsOrgAdmin(!user.is_platform_admin) 
        }
      } catch (error) {
        console.error('Failed to fetch user role', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserRole()
  }, [])

  // Platform Admin Groups
  const platformGroups: NavGroup[] = [
    {
      title: 'Operations',
      items: [
        { href: '/home', label: 'Dashboard', icon: Home },
        { href: '/tickets', label: 'Ticket Queue', icon: Ticket },
      ]
    },
    {
      title: 'Client Management',
      items: [
        { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
      ]
    },
    {
      title: 'Global Assets',
      items: [
        { href: '/hardware', label: 'Hardware Registry', icon: Cpu },
        { href: '/locations', label: 'All Locations', icon: MapPin },
      ]
    },
    {
      title: 'System',
      items: [
        { href: '/sops', label: 'SOP Library', icon: FileText },
        { href: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ]

  // Standard Navigation (Org Admin / Employee)
  const standardItems: NavItem[] = [
    { href: '/home', label: 'Dashboard', icon: Home },
    { href: '/locations', label: 'Locations', icon: MapPin },
    { href: '/hardware', label: 'Hardware', icon: Cpu },
    { href: '/sops', label: 'SOPs', icon: FileText },
    { href: '/tickets', label: 'Tickets', icon: Ticket },
    // Only show My Team for Org Admins ideally, but we'll keep it simple for now or hide if employee
    { href: '/admin/users', label: 'My Team', icon: Users }, 
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon
    const isActive = pathname.startsWith(item.href)
    
    return (
      <Link
        href={item.href}
        onClick={closeMobile}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-lg
          transition-all text-sm
          ${isActive 
            ? 'bg-accent text-accent-foreground shadow-md font-semibold' 
            : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
          }
        `}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    )
  }

  if (loading) return <div className="w-64 bg-primary h-screen" />

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-primary
        transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-screen border-r border-primary-foreground/10
      `}>
        {/* Logo & Close Button */}
        <div className="p-6 flex items-center justify-between">
          <Image
            src="/64da9f27fb4e049b5cd05ea6_ilv3.svg"
            alt="Integrated LV Logo"
            width={140}
            height={35}
            priority
            className="opacity-90"
          />
          <button
            onClick={closeMobile}
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 p-2 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-foreground/10">
          {isPlatformAdmin ? (
            // Grouped Navigation for Platform Admin
            <div className="space-y-6">
              {platformGroups.map((group, i) => (
                <div key={i}>
                  <h3 className="px-4 mb-2 text-xs font-bold uppercase tracking-wider text-primary-foreground/40">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink key={item.href} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Flat Navigation for others
            <div className="space-y-1">
              {standardItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-foreground/10 bg-black/10">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
              {isPlatformAdmin ? 'PA' : 'UA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary-foreground truncate">
                {isPlatformAdmin ? 'Platform Admin' : 'User Account'}
              </p>
              <p className="text-[10px] text-primary-foreground/60">
                Logged In
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
