'use client'

import { useOrgContext } from '@/contexts/OrgContext'
import { Building2 } from 'lucide-react'

export function WorkspaceIndicator() {
  const { selectedOrgName, isPlatformAdmin } = useOrgContext()

  if (!isPlatformAdmin || !selectedOrgName) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary-foreground/10 rounded-lg">
      <Building2 className="h-4 w-4 text-primary-foreground" />
      <div className="text-xs">
        <p className="text-primary-foreground/60 font-semibold uppercase tracking-wide">Workspace</p>
        <p className="text-primary-foreground font-bold truncate">{selectedOrgName}</p>
      </div>
    </div>
  )
}


