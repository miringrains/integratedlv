'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, AlertCircle, CheckCircle2, User, MapPin, Clock, BarChart3, MoreHorizontal, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState<'open' | 'in_progress' | 'resolved' | 'all'>('open')

  useEffect(() => {
    loadTickets()
  }, [])

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      resolved: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
      closed: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    }
    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      cancelled: 'Cancelled',
    }
    return (
      <Badge variant="outline" className={`${styles[status] || styles.open} border`}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') {
      return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">URGENT</Badge>
    }
    if (priority === 'high') {
      return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">High</Badge>
    }
    return <span className="text-xs text-muted-foreground capitalize">{priority}</span>
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
    return then.toLocaleDateString()
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ticket Queue</h1>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{tickets.length}</span>
              <span className="text-muted-foreground">total tickets</span>
            </div>
            {stats.urgent > 0 && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-semibold">{stats.urgent}</span>
                  <span>urgent attention</span>
                </div>
              </>
            )}
          </div>
        </div>
        <Link href="/tickets/new">
          <Button className="bg-accent hover:bg-accent-dark transition-colors shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-1 rounded-lg border">
        {/* View Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-md w-full sm:w-auto">
          {(['open', 'in_progress', 'resolved', 'all'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`
                flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-sm transition-all
                ${activeView === view 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }
              `}
            >
              {view.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <span className="ml-2 text-xs opacity-60">
                {view === 'all' ? tickets.length : stats[view]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-9 h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead className="w-[400px]">Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="text-right">Last Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {searchTerm ? 'No tickets found matching your search.' : 'No tickets in this view.'}
                </TableCell>
              </TableRow>
            ) : (
              displayTickets.map((ticket) => (
                <TableRow key={ticket.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <span className="mono-id text-xs font-medium text-muted-foreground">
                      {ticket.ticket_number}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Link href={`/tickets/${ticket.id}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                        {ticket.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{ticket.location_name}</span>
                        {ticket.hardware_name && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{ticket.hardware_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(ticket.status)}
                  </TableCell>

                  <TableCell>
                    {getPriorityBadge(ticket.priority)}
                  </TableCell>

                  <TableCell>
                    {ticket.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={ticket.assignee_avatar} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {ticket.assignee_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                          {ticket.assignee_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatRelativeTime(ticket.updated_at || ticket.created_at)}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/tickets/${ticket.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Assign Ticket
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Close Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
