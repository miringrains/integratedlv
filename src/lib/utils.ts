import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy")
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy h:mm a")
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getStatusColor(status: string) {
  const statusMap: Record<string, string> = {
    open: "badge-status bg-accent/10 text-accent border-accent/30",
    in_progress: "badge-status bg-primary/10 text-primary border-primary/30",
    resolved: "badge-status bg-green-100 text-green-700 border-green-300",
    closed: "badge-status bg-gray-200 text-gray-700 border-gray-300",
    cancelled: "badge-status bg-red-100 text-red-700 border-red-300",
  }
  return statusMap[status] || statusMap.open
}

export function getPriorityColor(priority: string) {
  const priorityMap: Record<string, string> = {
    urgent: "badge-status bg-accent text-white border-accent",
    high: "badge-status bg-accent/70 text-white border-accent/70",
    normal: "badge-status bg-primary/20 text-primary border-primary/30",
    low: "badge-status bg-muted text-muted-foreground border-muted",
  }
  return priorityMap[priority] || priorityMap.normal
}

export function getStatusLabel(status: string) {
  const labelMap: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    cancelled: "Cancelled",
  }
  return labelMap[status] || status
}

export function formatDuration(milliseconds: number) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

