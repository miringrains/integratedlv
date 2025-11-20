'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrgContext } from '@/contexts/OrgContext'
import { Building2 } from 'lucide-react'

export function OrgSelector() {
  const { selectedOrgId, selectedOrgName, allOrgs, setSelectedOrg, isPlatformAdmin } = useOrgContext()

  if (!isPlatformAdmin || allOrgs.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-2 border-gray-200">
      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
      <span className="text-xs font-semibold text-muted-foreground">Managing:</span>
      <Select
        value={selectedOrgId || ''}
        onValueChange={(value) => {
          const org = allOrgs.find(o => o.id === value)
          if (org) setSelectedOrg(org.id, org.name)
        }}
      >
        <SelectTrigger className="border-0 h-8 text-sm font-semibold min-w-[150px] focus:ring-0">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {allOrgs.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}


