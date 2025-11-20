'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, AlertCircle, CheckCircle2, User, MapPin, Cpu, Image as ImageIcon, Clock, BarChart3 } from 'lucide-react'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState<'open' | 'in_progress' | 'resolved' | 'all'>('open')
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
      const response = await fetch('/api/tickets/all')
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
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
  let displayTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // View filter
  if (activeView === 'open') {
    displayTickets = displayTickets.filter(t => t.status === 'open')
  } else if (activeView === 'in_progress') {
    displayTickets = displayTickets.filter(t => t.status === 'in_progress')
  } else if (activeView === 'resolved') {
    displayTickets = displayTickets.filter(t => ['resolved', 'closed'].includes(t.status))
  }

  // Calculate stats
  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    urgent: tickets.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length,
  }

  return (
    <div className="space-y-6">
      {/* Clean Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{tickets.length}</span>
              <span className="text-muted-foreground">total</span>
            </div>
            {stats.urgent > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-accent">{stats.urgent}</span>
                  <span className="text-muted-foreground">urgent</span>
                </div>
              </>
            )}
          </div>
        </div>
        <Link href="/tickets/new">
          <Button size="lg" className="bg-accent hover:bg-accent-dark transition-colors w-full md:w-auto">
            <Plus className="h-5 w-5 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by ticket number or title..."
          className="pl-12 h-12 border-2 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Simple Tab Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveView('open')}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
            activeView === 'open'
              ? 'bg-accent text-white'
              : 'bg-card hover:bg-white border-2 border-transparent hover:border-primary'
          }`}
        >
          Open
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
            {stats.open}
          </span>
        </button>
        <button
          onClick={() => setActiveView('in_progress')}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
            activeView === 'in_progress'
              ? 'bg-primary text-white'
              : 'bg-card hover:bg-white border-2 border-transparent hover:border-primary'
          }`}
        >
          In Progress
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
            {stats.in_progress}
          </span>
        </button>
        <button
          onClick={() => setActiveView('resolved')}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
            activeView === 'resolved'
              ? 'bg-green-600 text-white'
              : 'bg-card hover:bg-white border-2 border-transparent hover:border-primary'
          }`}
        >
          Resolved
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
            {stats.resolved}
          </span>
        </button>
        <button
          onClick={() => setActiveView('all')}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
            activeView === 'all'
              ? 'bg-gray-700 text-white'
              : 'bg-card hover:bg-white border-2 border-transparent hover:border-primary'
          }`}
        >
          All Tickets
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
            {tickets.length}
          </span>
        </button>
      </div>

      {/* Event Ticket Style Cards */}
      {displayTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {activeView === 'resolved' ? 'No resolved tickets' : 'No tickets found'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Create your first support ticket'}
            </p>
            <Link href="/tickets/new">
              <Button size="lg" className="bg-accent hover:bg-accent-dark">
                <Plus className="h-5 w-5 mr-2" />
                Create Ticket
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTickets.map((ticket: any) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="card-hover group h-full overflow-hidden relative">
                {/* Ticket Tear Perforation Effect */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none">
                  <div className="absolute left-0 top-0 bottom-0 w-[1px]" 
                       style={{
                         backgroundImage: 'repeating-linear-gradient(0deg, #e8ebe9, #e8ebe9 4px, transparent 4px, transparent 8px)'
                       }}
                  />
                </div>

                {/* Priority Tab */}
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-xs font-bold text-white ${
                  ticket.priority === 'urgent' ? 'bg-accent' :
                  ticket.priority === 'high' ? 'bg-accent/70' :
                  ticket.priority === 'normal' ? 'bg-primary' :
                  'bg-gray-400'
                }`}>
                  {ticket.priority === 'urgent' && <AlertCircle className="h-3 w-3 inline mr-1" />}
                  {ticket.priority.toUpperCase()}
                </div>

                <CardContent className="p-6 pt-10">
                  {/* Ticket Number */}
                  <div className="mono-id text-primary mb-3">
                    {ticket.ticket_number}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 mb-4 min-h-[3.5rem]">
                    {ticket.title}
                  </h3>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 text-sm border-t pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{ticket.location_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Cpu className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{ticket.hardware_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate text-xs">{ticket.submitter_name}</span>
                      </div>
                      {ticket.attachment_count > 0 && (
                        <div className="flex items-center gap-1 text-accent font-bold">
                          <ImageIcon className="h-4 w-4" />
                          {ticket.attachment_count}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      {formatRelativeTime(ticket.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
