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
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || colors.open
  }

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
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
          <Button size="lg" className="w-full sm:w-auto">
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
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="flex flex-col items-center gap-1 py-1">
              <span className="text-sm font-medium">All</span>
              <Badge variant="secondary" className="text-xs">{tickets.length}</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger value="my" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="flex flex-col items-center gap-1 py-1">
              <span className="text-sm font-medium">My Tickets</span>
              <Badge variant="secondary" className="text-xs">0</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="flex flex-col items-center gap-1 py-1">
              <span className="text-sm font-medium">Unassigned</span>
              <Badge variant="secondary" className="text-xs">0</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger value="urgent" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <div className="flex flex-col items-center gap-1 py-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Urgent</span>
              <Badge variant="destructive" className="text-xs">0</Badge>
            </div>
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
                <Card key={ticket.id} className="hover:shadow-md transition-all hover:border-accent/50 cursor-pointer">
                  <Link href={`/tickets/${ticket.id}`}>
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Priority Bar */}
                        <div className={`w-1.5 rounded-l-lg ${
                          ticket.priority === 'urgent' ? 'bg-red-500' :
                          ticket.priority === 'high' ? 'bg-orange-500' :
                          ticket.priority === 'normal' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`} />

                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Header */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-semibold text-primary">
                                  {ticket.ticket_number}
                                </span>
                                <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                                  {getStatusLabel(ticket.status)}
                                </Badge>
                                {ticket.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    URGENT
                                  </Badge>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="font-semibold text-base text-foreground group-hover:text-accent line-clamp-1">
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
                  </Link>
                </Card>
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

