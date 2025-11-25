// Database Types
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      org_memberships: {
        Row: OrgMembership
        Insert: Omit<OrgMembership, 'id' | 'created_at'>
        Update: Partial<Omit<OrgMembership, 'id' | 'created_at'>>
      }
      locations: {
        Row: Location
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Location, 'id' | 'created_at'>>
      }
      location_assignments: {
        Row: LocationAssignment
        Insert: Omit<LocationAssignment, 'id' | 'created_at'>
        Update: Partial<Omit<LocationAssignment, 'id' | 'created_at'>>
      }
      hardware: {
        Row: Hardware
        Insert: Omit<Hardware, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Hardware, 'id' | 'created_at'>>
      }
      sops: {
        Row: SOP
        Insert: Omit<SOP, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SOP, 'id' | 'created_at'>>
      }
      hardware_sops: {
        Row: HardwareSOP
        Insert: Omit<HardwareSOP, 'id' | 'created_at'>
        Update: Partial<Omit<HardwareSOP, 'id' | 'created_at'>>
      }
      care_log_tickets: {
        Row: CareLogTicket
        Insert: Omit<CareLogTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CareLogTicket, 'id' | 'ticket_number' | 'created_at'>>
      }
      ticket_events: {
        Row: TicketEvent
        Insert: Omit<TicketEvent, 'id' | 'created_at'>
        Update: Partial<Omit<TicketEvent, 'id' | 'created_at'>>
      }
      ticket_attachments: {
        Row: TicketAttachment
        Insert: Omit<TicketAttachment, 'id' | 'created_at'>
        Update: Partial<Omit<TicketAttachment, 'id' | 'created_at'>>
      }
      ticket_timing_analytics: {
        Row: TicketTimingAnalytics
        Insert: Omit<TicketTimingAnalytics, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TicketTimingAnalytics, 'id' | 'created_at'>>
      }
      ticket_comments: {
        Row: TicketComment
        Insert: Omit<TicketComment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TicketComment, 'id' | 'created_at'>>
      }
    }
  }
}

// Table Types
export interface Organization {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  is_platform_admin: boolean
  admin_level?: 'super_admin' | 'technician' | 'read_only' | null
  created_at: string
  updated_at: string
}

export type UserRole = 'platform_admin' | 'org_admin' | 'employee'

export interface OrgMembership {
  id: string
  org_id: string
  user_id: string
  role: UserRole
  created_at: string
}

export interface Location {
  id: string
  org_id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string
  manager_name: string | null
  manager_phone: string | null
  manager_email: string | null
  store_hours: string | null
  timezone: string
  internal_notes: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export interface LocationAssignment {
  id: string
  user_id: string
  location_id: string
  created_at: string
}

export type HardwareStatus = 'active' | 'inactive' | 'decommissioned' | 'maintenance'

export interface Hardware {
  id: string
  org_id: string
  location_id: string
  name: string
  hardware_type: string
  manufacturer: string | null
  model_number: string | null
  serial_number: string | null
  status: HardwareStatus
  installation_date: string | null
  last_maintenance_date: string | null
  warranty_expiration: string | null
  vendor_url: string | null
  main_image_url: string | null
  gallery_images: string[]
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface SOP {
  id: string
  org_id: string
  title: string
  content: string
  hardware_type: string | null
  created_by: string | null
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HardwareSOP {
  id: string
  hardware_id: string
  sop_id: string
  created_at: string
}

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'

export interface CareLogTicket {
  id: string
  org_id: string
  location_id: string
  hardware_id: string
  ticket_number: string
  submitted_by: string
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  sop_acknowledged: boolean
  sop_acknowledged_at: string | null
  acknowledged_sop_ids: string[]
  assigned_to: string | null
  created_at: string
  first_response_at: string | null
  resolved_at: string | null
  closed_at: string | null
  closed_summary: string | null
  updated_at: string
}

export type TicketEventType = 
  | 'created' 
  | 'status_changed' 
  | 'assigned' 
  | 'comment_added' 
  | 'attachment_added' 
  | 'priority_changed' 
  | 'updated'

export interface TicketEvent {
  id: string
  ticket_id: string
  user_id: string | null
  event_type: TicketEventType
  old_value: string | null
  new_value: string | null
  comment: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface TicketAttachment {
  id: string
  ticket_id: string
  uploaded_by: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  caption: string | null
  created_at: string
}

export interface TicketTimingAnalytics {
  id: string
  ticket_id: string
  time_to_first_response_ms: number | null
  time_to_resolve_ms: number | null
  time_open_total_ms: number | null
  created_at: string
  updated_at: string
}

export interface TicketComment {
  id: string
  ticket_id: string
  user_id: string
  comment: string
  is_internal: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface ProfileWithMemberships extends Profile {
  org_memberships: OrgMembership[]
}

export interface LocationWithDetails extends Location {
  hardware_count?: number
  open_tickets_count?: number
}

export interface HardwareWithRelations extends Hardware {
  location: Location
  sops: SOP[]
}

export interface TicketWithRelations extends CareLogTicket {
  location: Location
  hardware: Hardware
  submitted_by_profile: Profile
  assigned_to_profile?: Profile
  events: TicketEvent[]
  attachments: TicketAttachment[]
  timing_analytics?: TicketTimingAnalytics
}

export interface TicketCommentWithUser extends TicketComment {
  user: Profile
}
