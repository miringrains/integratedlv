'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  MapPin, 
  Cpu, 
  Users, 
  FileText, 
  Ticket, 
  Building2,
  Plus,
  ArrowRight
} from 'lucide-react'
import { OrganizationEditForm } from './OrganizationEditForm'

interface OrganizationTabsProps {
  orgId: string
  organization: {
    id: string
    name: string
    business_address: string | null
    business_city: string | null
    business_state: string | null
    business_zip: string | null
    business_country: string | null
    business_hours: Record<string, string> | null
    account_service_manager_id: string | null
    sla_response_time_normal: number | null
    sla_response_time_high: number | null
    sla_response_time_urgent: number | null
    sla_resolution_time_normal: number | null
    sla_resolution_time_high: number | null
    sla_resolution_time_urgent: number | null
  }
  platformAdmins: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }>
  locations: Array<{
    id: string
    name: string
    city: string | null
    state: string | null
  }>
  hardware: Array<{
    id: string
    name: string
    hardware_type: string
    location?: { name: string } | null
  }>
  departments: Array<{
    id: string
    name: string
    description: string | null
  }>
  contracts: Array<{
    id: string
    contract_number: string
    name: string
    status: string
    start_date: string
    end_date: string | null
  }>
  tickets: Array<{
    id: string
    ticket_number: string
    title: string
    status: string
    priority: string
    created_at: string
  }>
  contacts: Array<{
    id: string
    name: string
    email: string | null
    phone: string | null
    role: string | null
  }>
}

export function OrganizationTabs({
  orgId,
  organization,
  platformAdmins,
  locations,
  hardware,
  departments,
  contracts,
  tickets,
  contacts
}: OrganizationTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="locations">
          Locations ({locations.length})
        </TabsTrigger>
        <TabsTrigger value="contacts">
          Contacts ({contacts.length})
        </TabsTrigger>
        <TabsTrigger value="departments">
          Departments ({departments.length})
        </TabsTrigger>
        <TabsTrigger value="devices">
          Devices ({hardware.length})
        </TabsTrigger>
        <TabsTrigger value="contracts">
          Contracts ({contracts.length})
        </TabsTrigger>
        <TabsTrigger value="tickets">
          Tickets ({tickets.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-4">
        <OrganizationEditForm 
          organization={organization} 
          platformAdmins={platformAdmins} 
        />
      </TabsContent>

      <TabsContent value="locations" className="mt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Locations</h3>
            <Link href={`/locations/new?orgId=${orgId}`}>
              <Button size="sm" className="bg-accent hover:bg-accent-dark h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Location
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {locations.length > 0 ? (
                <div className="divide-y">
                  {locations.map((loc) => (
                    <div key={loc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <Link href={`/locations/${loc.id}`} className="font-semibold hover:text-primary hover:underline">
                          {loc.name}
                        </Link>
                        <div className="text-sm text-muted-foreground mt-1">
                          {loc.city && loc.state ? `${loc.city}, ${loc.state}` : 'No address'}
                        </div>
                      </div>
                      <Link href={`/locations/${loc.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No locations found. Add one to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="contacts" className="mt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contacts</h3>
            <Link href={`/contacts/new?orgId=${orgId}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Contact
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {contacts.length > 0 ? (
                <div className="divide-y">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-semibold">{contact.name}</p>
                        <div className="text-sm text-muted-foreground mt-1">
                          {contact.email && <span>{contact.email}</span>}
                          {contact.email && contact.phone && <span> • </span>}
                          {contact.phone && <span>{contact.phone}</span>}
                          {contact.role && <span className="ml-2">({contact.role})</span>}
                        </div>
                      </div>
                      <Link href={`/contacts/${contact.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No contacts found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="departments" className="mt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Departments</h3>
            <Link href={`/admin/organizations/${orgId}/departments/new`}>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Department
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {departments.length > 0 ? (
                <div className="divide-y">
                  {departments.map((dept) => (
                    <div key={dept.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-semibold">{dept.name}</p>
                        {dept.description && (
                          <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                        )}
                      </div>
                      <Link href={`/admin/organizations/${orgId}/departments/${dept.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No departments found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="devices" className="mt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Devices</h3>
            <Link href={`/hardware/new?orgId=${orgId}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Device
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {hardware.length > 0 ? (
                <div className="divide-y">
                  {hardware.map((hw) => (
                    <div key={hw.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Cpu className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <Link href={`/hardware/${hw.id}`} className="font-semibold hover:text-primary hover:underline">
                            {hw.name}
                          </Link>
                          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] h-5">
                              {hw.hardware_type}
                            </Badge>
                            <span>•</span>
                            <span className="text-xs">{hw.location?.name || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/hardware/${hw.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No devices found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="contracts" className="mt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contracts</h3>
            <Link href={`/admin/organizations/${orgId}/contracts/new`}>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Contract
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {contracts.length > 0 ? (
                <div className="divide-y">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{contract.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="font-mono text-xs">{contract.contract_number}</span>
                          {contract.end_date && (
                            <>
                              <span> • </span>
                              <span>Ends: {new Date(contract.end_date).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Link href={`/admin/organizations/${orgId}/contracts/${contract.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No contracts found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="tickets" className="mt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ticket History</h3>
            <Link href={`/tickets?org=${orgId}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                View All →
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {tickets.length > 0 ? (
                <div className="divide-y">
                  {tickets.map((ticket) => (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                      <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            {ticket.priority === 'urgent' && (
                              <Badge className="bg-accent text-white text-[10px]">Urgent</Badge>
                            )}
                          </div>
                          <p className="font-medium text-sm mt-1">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No tickets found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
