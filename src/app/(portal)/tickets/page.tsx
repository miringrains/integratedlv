'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, AlertCircle, CheckCircle2, User, MapPin, Cpu, Image as ImageIcon, Clock, Filter, BarChart3 } from 'lucide-react'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // active, closed, all
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadTickets()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/me')
      const data = await response.json()
      setCurrentUserId(data.id)
    } catch (error) {
      console.error(error)
    }
  }

  const loadTickets = async () => {
    try {
      // For now, empty - will connect to API
      setTickets([])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'badge-active-animated bg-accent/10 text-accent',
      in_progress: 'badge-active-animated bg-primary/10 text-primary',
      resolved: 'badge-status bg-green-100 text-green-700 border-green-300',
      closed: 'badge-status bg-gray-200 text-gray-700 border-gray-300',
      cancelled: 'badge-status bg-red-100 text-red-700 border-red-300',
    }
    return colors[status] || colors.open
  }

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getPriorityColor = (priority: string) => {
    return priority === 'urgent' ? 'bg-accent' :
           priority === 'high' ? 'bg-accent/70' :
           priority === 'normal' ? 'bg-primary' :
           'bg-muted'
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return `${Math.floor(diffDays / 7)}w ago`
  }

  // Filter tickets
  let filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Status filter
  if (statusFilter === 'active') {
    filteredTickets = filteredTickets.filter(t => ['open', 'in_progress'].includes(t.status))
  } else if (statusFilter === 'closed') {
    filteredTickets = filteredTickets.filter(t => ['resolved', 'closed'].includes(t.status))
  }

  // Priority filter
  if (priorityFilter !== 'all') {
    filteredTickets = filteredTickets.filter(t => t.priority === priorityFilter)
  }

  // Smart views
  const mySubmissions = tickets.filter(t => t.submitted_by === currentUserId)
  const myAssigned = tickets.filter(t => t.assigned_to === currentUserId)
  const unassigned = tickets.filter(t => !t.assigned_to && ['open', 'in_progress'].includes(t.status))
  const urgent = tickets.filter(t => t.priority === 'urgent' && ['open', 'in_progress'].includes(t.status))

  // Stats
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  }

  return (
    <div className="space-y-4">
      {/* Efficient Header with Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{stats.total}</span>
              <span className="text-muted-foreground">total</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-accent">{stats.open}</span>
              <span className="text-muted-foreground">open</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">{stats.in_progress}</span>
              <span className="text-muted-foreground">working</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-600">{stats.resolved}</span>
              <span className="text-muted-foreground">resolved</span>
            </div>
          </div>
        </div>
        <div className="flex lg:justify-end">
          <Link href="/tickets/new" className="w-full lg:w-auto">
            <Button size="lg" className="w-full bg-accent hover:bg-accent-dark transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by ticket number or title..."
            className="pl-12 h-11 border-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Tickets</SelectItem>
              <SelectItem value="closed">Closed Tickets</SelectItem>
              <SelectItem value="all">All Tickets</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-11 border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent Only</SelectItem>
              <SelectItem value="high">High Only</SelectItem>
              <SelectItem value="normal">Normal Only</SelectItem>
              <SelectItem value="low">Low Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Smart Views */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-card">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col gap-1 py-2">
            <span className="text-xs font-semibold tracking-wide uppercase">All</span>
            <Badge className="bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
              {filteredTickets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="mine" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col gap-1 py-2">
            <span className="text-xs font-semibold tracking-wide uppercase">My Submissions</span>
            <Badge className="bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
              {mySubmissions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col gap-1 py-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Assigned to Me</span>
            <Badge className="bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
              {myAssigned.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col gap-1 py-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Unassigned</span>
            <Badge className="bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
              {unassigned.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="urgent" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex-col gap-1 py-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-wide uppercase">Urgent</span>
            <Badge className="bg-accent-tint text-accent px-2 py-0.5 text-[10px] font-bold rounded-full">
              {urgent.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Tickets - Card Grid */}
        <TabsContent value="all" className="mt-4">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  {searchTerm ? 'Try adjusting your search or filters' : 'Create your first support ticket to get started'}
                </p>
                <Link href="/tickets/new">
                  <Button size="lg" className="bg-accent hover:bg-accent-dark">
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Ticket
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket: any) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                  <Card className="card-hover group h-full">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className={`w-1 rounded-l-lg transition-colors duration-300 ${getPriorityColor(ticket.priority)}`} />
                        <div className="flex-1 p-4 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="mono-id text-primary">
                              {ticket.ticket_number}
                            </span>
                            {ticket.priority === 'urgent' && (
                              <Badge className="badge-urgent-animated">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                URGENT
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 min-h-[2.5rem]">
                            {ticket.title}
                          </h3>

                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusLabel(ticket.status)}
                          </Badge>

                          <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{ticket.location_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Cpu className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{ticket.hardware_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate text-[10px]">{ticket.submitter_name}</span>
                              </div>
                              {ticket.attachment_count > 0 && (
                                <div className="flex items-center gap-1 text-accent font-semibold">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  {ticket.attachment_count}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              {formatRelativeTime(ticket.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Other tabs with empty states */}
        <TabsContent value="mine">
          <Card>
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold">No tickets submitted yet</p>
              <p className="text-sm text-muted-foreground mt-2">Tickets you create will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned">
          <Card>
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold">No tickets assigned to you</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unassigned">
          <Card>
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-semibold">All tickets are assigned</p>
              <p className="text-sm text-muted-foreground mt-2">Great teamwork!</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgent">
          <Card>
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-semibold">No urgent tickets</p>
              <p className="text-sm text-muted-foreground mt-2">Everything under control!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
