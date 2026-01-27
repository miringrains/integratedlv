'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Download,
  FileText,
  Star,
  AlertTriangle,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsClientProps {
  isPlatformAdmin: boolean
  organizations: Array<{
    id: string
    name: string
  }>
  tickets: Array<{
    id: string
    ticket_number: string
    title: string
    status: string
    priority: string
    org_id: string
    created_at: string
    resolved_at: string | null
    closed_at: string | null
    first_response_at: string | null
    customer_satisfaction_rating: number | null
    organization?: { name: string } | null
    hardware?: { name: string; hardware_type: string } | null
  }>
  initialOrgId?: string
}

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  if (ms < 86400000) return `${(ms / 3600000).toFixed(1)}h`
  return `${(ms / 86400000).toFixed(1)}d`
}

export function AnalyticsClient({ 
  isPlatformAdmin, 
  organizations, 
  tickets, 
  initialOrgId 
}: AnalyticsClientProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>(initialOrgId || 'all')
  const [dateRange, setDateRange] = useState<string>('30')
  const [exporting, setExporting] = useState(false)

  // Filter tickets based on selection
  const filteredTickets = useMemo(() => {
    let result = [...tickets]
    
    // Filter by org
    if (selectedOrg !== 'all') {
      result = result.filter(t => t.org_id === selectedOrg)
    }

    // Filter by date range
    const daysAgo = parseInt(dateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)
    result = result.filter(t => new Date(t.created_at) >= cutoffDate)

    return result
  }, [tickets, selectedOrg, dateRange])

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredTickets.length
    const open = filteredTickets.filter(t => t.status === 'open').length
    const inProgress = filteredTickets.filter(t => t.status === 'in_progress').length
    const resolved = filteredTickets.filter(t => t.status === 'resolved').length
    const closed = filteredTickets.filter(t => t.status === 'closed').length
    const urgent = filteredTickets.filter(t => t.priority === 'urgent').length
    
    // Response times
    const ticketsWithResponse = filteredTickets.filter(t => t.first_response_at && t.created_at)
    const avgResponseTime = ticketsWithResponse.length > 0
      ? ticketsWithResponse.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime()
          const responded = new Date(t.first_response_at!).getTime()
          return sum + (responded - created)
        }, 0) / ticketsWithResponse.length
      : 0

    // Resolution times
    const resolvedTickets = filteredTickets.filter(t => t.resolved_at && t.created_at)
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime()
          const resolvedTime = new Date(t.resolved_at!).getTime()
          return sum + (resolvedTime - created)
        }, 0) / resolvedTickets.length
      : 0

    // Satisfaction
    const ticketsWithRating = filteredTickets.filter(t => t.customer_satisfaction_rating)
    const avgSatisfaction = ticketsWithRating.length > 0
      ? ticketsWithRating.reduce((sum, t) => sum + (t.customer_satisfaction_rating || 0), 0) / ticketsWithRating.length
      : 0
    const dissatisfied = ticketsWithRating.filter(t => t.customer_satisfaction_rating && t.customer_satisfaction_rating < 3).length

    // By device
    const deviceCounts = new Map<string, number>()
    filteredTickets.forEach(t => {
      if (t.hardware?.name) {
        const key = t.hardware.name
        deviceCounts.set(key, (deviceCounts.get(key) || 0) + 1)
      }
    })
    const topDevices = Array.from(deviceCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      urgent,
      avgResponseTime,
      avgResolutionTime,
      avgSatisfaction,
      dissatisfied,
      ratingsCount: ticketsWithRating.length,
      topDevices
    }
  }, [filteredTickets])

  const exportToCSV = async () => {
    setExporting(true)
    try {
      const headers = ['Ticket #', 'Title', 'Status', 'Priority', 'Created', 'Resolved', 'Rating', 'Organization']
      const rows = filteredTickets.map(t => [
        t.ticket_number,
        t.title.replace(/,/g, ';'),
        t.status,
        t.priority,
        new Date(t.created_at).toLocaleDateString(),
        t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : '',
        t.customer_satisfaction_rating || '',
        t.organization?.name || ''
      ])

      const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `ticket-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('CSV report downloaded')
    } catch (error) {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const exportToPDF = async () => {
    setExporting(true)
    try {
      // Create a simple HTML report that can be printed
      const orgName = selectedOrg === 'all' 
        ? 'All Organizations' 
        : organizations.find(o => o.id === selectedOrg)?.name || 'Unknown'
      
      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ticket Report - ${orgName}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { color: #3A443E; margin-bottom: 8px; }
            h2 { color: #666; font-size: 14px; font-weight: normal; margin-bottom: 24px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
            .stat { padding: 16px; border: 1px solid #ddd; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .stat-label { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; }
            .print-btn { margin-bottom: 20px; padding: 10px 20px; background: #3A443E; color: white; border: none; border-radius: 4px; cursor: pointer; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
          <h1>Ticket Report</h1>
          <h2>${orgName} | Last ${dateRange} Days | Generated ${new Date().toLocaleDateString()}</h2>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${stats.total}</div>
              <div class="stat-label">Total Tickets</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats.resolved + stats.closed}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats.avgResponseTime > 0 ? formatDuration(stats.avgResponseTime) : 'N/A'}</div>
              <div class="stat-label">Avg Response</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats.avgSatisfaction > 0 ? stats.avgSatisfaction.toFixed(1) + '/5' : 'N/A'}</div>
              <div class="stat-label">Satisfaction</div>
            </div>
          </div>

          <h3>Ticket Details</h3>
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTickets.slice(0, 50).map(t => `
                <tr>
                  <td>${t.ticket_number}</td>
                  <td>${t.title}</td>
                  <td>${t.status}</td>
                  <td>${t.priority}</td>
                  <td>${new Date(t.created_at).toLocaleDateString()}</td>
                  <td>${t.customer_satisfaction_rating ? '★'.repeat(t.customer_satisfaction_rating) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${filteredTickets.length > 50 ? `<p>Showing 50 of ${filteredTickets.length} tickets</p>` : ''}
        </body>
        </html>
      `

      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(reportHtml)
        newWindow.document.close()
        toast.success('PDF report opened in new tab - use print to save')
      }
    } catch (error) {
      toast.error('Failed to generate PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Performance metrics and client reports
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {isPlatformAdmin && (
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last Quarter</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportToCSV}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              size="sm"
              className="bg-accent hover:bg-accent-dark"
              onClick={exportToPDF}
              disabled={exporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-accent">{stats.open}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved + stats.closed}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">
                  {stats.avgResponseTime > 0 ? formatDuration(stats.avgResponseTime) : 'N/A'}
                </p>
              </div>
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">
                  {stats.avgSatisfaction > 0 ? `${stats.avgSatisfaction.toFixed(1)}/5` : 'N/A'}
                </p>
              </div>
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Open', value: stats.open, color: 'bg-accent' },
              { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-500' },
              { label: 'Resolved', value: stats.resolved, color: 'bg-green-500' },
              { label: 'Closed', value: stats.closed, color: 'bg-gray-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Devices */}
        <Card>
          <CardHeader>
            <CardTitle>Top Devices by Ticket Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topDevices.length > 0 ? (
              <div className="space-y-3">
                {stats.topDevices.map((device, index) => (
                  <div key={device.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                      <span className="font-medium">{device.name}</span>
                    </div>
                    <Badge variant="outline">{device.count} tickets</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No device data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction breakdown */}
      {stats.ratingsCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
            <CardDescription>
              Based on {stats.ratingsCount} ratings | {stats.dissatisfied} dissatisfied customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`h-8 w-8 ${star <= Math.round(stats.avgSatisfaction) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} 
                  />
                ))}
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.avgSatisfaction.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Average rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
