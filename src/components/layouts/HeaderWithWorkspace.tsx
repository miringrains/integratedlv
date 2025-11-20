'use client'

import { useEffect, useState } from 'react'
import { OrgSelector } from '@/components/admin/OrgSelector'
import { Header } from './Header'

export function HeaderWithWorkspace() {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)

  useEffect(() => {
    checkRole()
  }, [])

  const checkRole = async () => {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const data = await response.json()
        setIsPlatformAdmin(data.is_platform_admin || false)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="relative">
      <Header />
      {isPlatformAdmin && (
        <div className="absolute left-4 md:left-[280px] top-1/2 -translate-y-1/2">
          <OrgSelector />
        </div>
      )}
    </div>
  )
}


