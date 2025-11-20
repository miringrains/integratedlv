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
  BarChart3,
  Building2
} from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

interface NavItem {
  href: string
  label: string
  icon: typeof Home
  requiresOrgAdmin?: boolean
  requiresPlatformAdmin?: boolean
}

export function Sidebar() {
  const pathname = usePathname()
  const { isMobileOpen, closeMobile } = useSidebar()
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)

  // TODO: Fetch user role from auth context
  useEffect(() => {
    // Placeholder - will be replaced with actual role check
    setIsOrgAdmin(true)
    setIsPlatformAdmin(false)
  }, [])

  // Different nav items based on role
  const platformAdminItems: NavItem[] = [
    { href: '/home', label: 'Workspaces', icon: Home },
    { href: '/admin/organizations', label: 'All Organizations', icon: Building2 },
    { href: '/locations', label: 'Locations', icon: MapPin },
    { href: '/hardware', label: 'Hardware', icon: Cpu },
    { href: '/sops', label: 'SOPs', icon: FileText },
    { href: '/tickets', label: 'Tickets', icon: Ticket },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const orgAdminItems: NavItem[] = [
    { href: '/home', label: 'Dashboard', icon: Home },
    { href: '/locations', label: 'Locations', icon: MapPin },
    { href: '/hardware', label: 'Hardware', icon: Cpu },
    { href: '/sops', label: 'SOPs', icon: FileText },
    { href: '/tickets', label: 'Tickets', icon: Ticket },
    { href: '/admin/users', label: 'My Team', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const employeeItems: NavItem[] = [
    { href: '/home', label: 'Dashboard', icon: Home },
    { href: '/tickets', label: 'My Tickets', icon: Ticket },
    { href: '/sops', label: 'SOPs', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  // TODO: Get actual user role from auth/profile
  // For now, show based on isOrgAdmin flag
  const navItems = isOrgAdmin ? orgAdminItems : employeeItems

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresPlatformAdmin && !isPlatformAdmin) return false
    if (item.requiresOrgAdmin && !isOrgAdmin) return false
    return true
  })

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
        flex flex-col h-screen
      `}>
        {/* Logo & Close Button */}
        <div className="p-6 border-b border-primary-foreground/10 flex items-center justify-between">
          <Image
            src="/64da9f27fb4e049b5cd05ea6_ilv3.svg"
            alt="Integrated LV Logo"
            width={150}
            height={40}
            priority
          />
          <button
            onClick={closeMobile}
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 p-2 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all
                  ${isActive 
                    ? 'bg-accent text-accent-foreground shadow-md' 
                    : 'text-primary-foreground hover:bg-primary-foreground/10'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-foreground/10">
          <p className="text-xs text-primary-foreground/60 text-center">
            © 2025 Integrated LV
          </p>
        </div>
      </aside>
    </>
  )
}

