'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Organization {
  id: string
  name: string
}

interface OrgContextType {
  selectedOrgId: string | null
  selectedOrgName: string | null
  allOrgs: Organization[]
  setSelectedOrg: (orgId: string, orgName: string) => void
  isPlatformAdmin: boolean
}

const OrgContext = createContext<OrgContextType | undefined>(undefined)

export function OrgProvider({ children, isPlatformAdmin = false }: { children: ReactNode; isPlatformAdmin?: boolean }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [selectedOrgName, setSelectedOrgName] = useState<string | null>(null)
  const [allOrgs, setAllOrgs] = useState<Organization[]>([])

  useEffect(() => {
    // Load from localStorage
    const savedOrgId = localStorage.getItem('selected_org_id')
    const savedOrgName = localStorage.getItem('selected_org_name')
    if (savedOrgId && savedOrgName) {
      setSelectedOrgId(savedOrgId)
      setSelectedOrgName(savedOrgName)
    }

    // Load all orgs if platform admin
    if (isPlatformAdmin) {
      loadOrganizations()
    }
  }, [isPlatformAdmin])

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setAllOrgs(data)
        
        // Auto-select first org if none selected
        if (!selectedOrgId && data.length > 0) {
          setSelectedOrg(data[0].id, data[0].name)
        }
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  const setSelectedOrg = (orgId: string, orgName: string) => {
    setSelectedOrgId(orgId)
    setSelectedOrgName(orgName)
    localStorage.setItem('selected_org_id', orgId)
    localStorage.setItem('selected_org_name', orgName)
    
    // Trigger page refresh to reload data with new org context
    window.location.reload()
  }

  return (
    <OrgContext.Provider value={{ selectedOrgId, selectedOrgName, allOrgs, setSelectedOrg, isPlatformAdmin }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrgContext() {
  const context = useContext(OrgContext)
  if (context === undefined) {
    throw new Error('useOrgContext must be used within an OrgProvider')
  }
  return context
}





