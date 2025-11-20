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
    open: "bg-accent/10 text-accent border border-accent/30",
    in_progress: "bg-primary/10 text-primary border border-primary/30",
    resolved: "bg-green-100 text-green-700 border border-green-300",
    closed: "bg-gray-100 text-gray-700 border border-gray-300",
    cancelled: "bg-red-100 text-red-700 border border-red-300",
  }
  return statusMap[status] || statusMap.open
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

