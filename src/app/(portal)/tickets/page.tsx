'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, AlertCircle, CheckCircle2, User, MapPin, Cpu, Image as ImageIcon, Clock } from 'lucide-react'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      // For now, just show empty state - we'll connect API later
      setTickets([])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'badge-status bg-accent/10 text-accent border-accent/30',
      in_progress: 'badge-status bg-primary/10 text-primary border-primary/30',
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

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">
            {tickets.length} total tickets
          </p>
        </div>
        <Link href="/tickets/new">
          <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent-dark transition-colors">
            <Plus className="h-5 w-5 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Simple Search Bar (No Ugly Dropdowns) */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by ticket number or title..."
          className="pl-12 h-12 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Smart Views */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col gap-1 py-2">
            <span className="text-xs font-semibold tracking-wide uppercase">All</span>
            <Badge className="bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
              {tickets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="my" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col gap-1 py-2">
            <span className="text-xs font-semibold tracking-wide uppercase">My Tickets</span>
            <Badge className="bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
              0
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-col gap-1 py-2">
            <span className="text-xs font-semibold tracking-wide uppercase">Unassigned</span>
            <Badge className="bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
              0
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="urgent" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex-col gap-1 py-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-wide uppercase">Urgent</span>
            <Badge className="bg-accent-tint text-accent px-2 py-0.5 text-[10px] font-bold rounded-full">
              0
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Tickets */}
        <TabsContent value="all" className="mt-4">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Create your first support ticket to get started
                </p>
                <Link href="/tickets/new">
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Ticket
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((ticket: any) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                  <Card className="ticket-card-hover cursor-pointer group">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Priority Bar - Subtle */}
                        <div className={`w-1 rounded-l-lg transition-colors duration-300 ${getPriorityColor(ticket.priority)}`} />

                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Header */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="mono-id text-primary">
                                  {ticket.ticket_number}
                                </span>
                                <Badge className={getStatusColor(ticket.status)}>
                                  {getStatusLabel(ticket.status)}
                                </Badge>
                                {ticket.priority !== 'normal' && (
                                  <Badge className={`badge-status ${getPriorityColor(ticket.priority)} text-white border-0`}>
                                    {ticket.priority === 'urgent' && <AlertCircle className="h-3 w-3 mr-1" />}
                                    {ticket.priority}
                                  </Badge>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                                {ticket.title}
                              </h3>

                              {/* Meta */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  {ticket.submitter_name}
                                </div>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {ticket.location_name}
                                </div>
                                <span className="hidden md:inline">•</span>
                                <div className="flex items-center gap-1">
                                  <Cpu className="h-3.5 w-3.5" />
                                  {ticket.hardware_name}
                                </div>
                                {ticket.attachment_count > 0 && (
                                  <>
                                    <span className="hidden lg:inline">•</span>
                                    <div className="flex items-center gap-1 text-accent font-medium">
                                      <ImageIcon className="h-3.5 w-3.5" />
                                      {ticket.attachment_count}
                                    </div>
                                  </>
                                )}
                                <span className="hidden lg:inline">•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatRelativeTime(ticket.created_at)}
                                </div>
                              </div>
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

        {/* Other tabs use same component */}
        <TabsContent value="my">
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              No tickets assigned to you
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unassigned">
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              All tickets are assigned
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgent">
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
              No urgent tickets - nice work!
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

