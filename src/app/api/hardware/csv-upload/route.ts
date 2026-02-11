import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

const REQUIRED_HEADERS = ['organization_name', 'location_name', 'name', 'hardware_type']
const ALL_HEADERS = [
  'organization_name', 'location_name', 'name', 'hardware_type',
  'manufacturer', 'model_number', 'serial_number', 'status',
  'installation_date', 'warranty_expiration', 'internal_notes',
]
const VALID_STATUSES = ['active', 'inactive', 'maintenance', 'decommissioned']

interface ParsedRow {
  rowNumber: number
  raw: Record<string, string>
  errors: string[]
  org_id?: string
  location_id?: string
}

interface UploadResult {
  success: boolean
  totalRows: number
  insertedCount: number
  errorCount: number
  errors: Array<{ row: number; errors: string[] }>
  insertedDevices: Array<{ name: string; organization: string; location: string }>
}

/**
 * Parses CSV text into rows. Handles quoted fields with commas and newlines.
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"'
        i++ // skip next quote
      } else if (char === '"') {
        inQuotes = false
      } else {
        currentCell += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentCell.trim())
        currentCell = ''
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim())
        if (currentRow.some(cell => cell !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
        currentCell = ''
        if (char === '\r') i++ // skip \n after \r
      } else {
        currentCell += char
      }
    }
  }

  // Last row (if file doesn't end with newline)
  currentRow.push(currentCell.trim())
  if (currentRow.some(cell => cell !== '')) {
    rows.push(currentRow)
  }

  return rows
}

/**
 * Validates a date string is YYYY-MM-DD format and a real date.
 */
function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const d = new Date(str + 'T00:00:00Z')
  return !isNaN(d.getTime())
}

/**
 * POST /api/hardware/csv-upload
 * Accepts CSV file, validates all rows, resolves org/location names to IDs,
 * and inserts valid devices. Returns detailed per-row error reporting.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only platform admins can bulk upload
    const isPlatformAdminUser = await isPlatformAdmin()
    if (!isPlatformAdminUser) {
      return NextResponse.json({ error: 'Only platform admins can bulk upload devices' }, { status: 403 })
    }

    // Parse the uploaded file
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a .csv file' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })
    }

    // Validate headers
    const headerRow = rows[0].map(h => h.toLowerCase().trim().replace(/\s+/g, '_'))
    const missingHeaders = REQUIRED_HEADERS.filter(h => !headerRow.includes(h))
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingHeaders.join(', ')}. Required: ${REQUIRED_HEADERS.join(', ')}` 
      }, { status: 400 })
    }

    // Map header indices
    const headerMap: Record<string, number> = {}
    headerRow.forEach((h, i) => {
      if (ALL_HEADERS.includes(h)) {
        headerMap[h] = i
      }
    })

    const dataRows = rows.slice(1)
    if (dataRows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 devices per upload' }, { status: 400 })
    }

    // Use service role to bypass RLS for lookups and inserts
    const adminSupabase = createServiceRoleClient()

    // Pre-fetch all organizations and locations for efficient lookup
    const { data: allOrgs } = await adminSupabase
      .from('organizations')
      .select('id, name')

    const { data: allLocations } = await adminSupabase
      .from('locations')
      .select('id, name, org_id')

    // Build lookup maps (case-insensitive)
    const orgMap = new Map<string, { id: string; name: string }>()
    for (const org of allOrgs || []) {
      orgMap.set(org.name.toLowerCase().trim(), { id: org.id, name: org.name })
    }

    const locationsByOrg = new Map<string, Map<string, { id: string; name: string }>>()
    for (const loc of allLocations || []) {
      if (!locationsByOrg.has(loc.org_id)) {
        locationsByOrg.set(loc.org_id, new Map())
      }
      locationsByOrg.get(loc.org_id)!.set(loc.name.toLowerCase().trim(), { id: loc.id, name: loc.name })
    }

    // Validate each row
    const parsedRows: ParsedRow[] = dataRows.map((cells, index) => {
      const rowNum = index + 2 // +2 because row 1 is header, 0-indexed
      const errors: string[] = []

      const getValue = (key: string): string => {
        const idx = headerMap[key]
        return idx !== undefined && idx < cells.length ? cells[idx].trim() : ''
      }

      const raw: Record<string, string> = {}
      for (const key of ALL_HEADERS) {
        raw[key] = getValue(key)
      }

      const row: ParsedRow = { rowNumber: rowNum, raw, errors }

      // Validate required fields
      if (!raw.organization_name) errors.push('organization_name is required')
      if (!raw.location_name) errors.push('location_name is required')
      if (!raw.name) errors.push('name (device name) is required')
      if (!raw.hardware_type) errors.push('hardware_type is required')

      // Resolve organization
      if (raw.organization_name) {
        const org = orgMap.get(raw.organization_name.toLowerCase().trim())
        if (!org) {
          errors.push(`Organization "${raw.organization_name}" not found`)
        } else {
          row.org_id = org.id

          // Resolve location within that organization
          if (raw.location_name) {
            const locMap = locationsByOrg.get(org.id)
            const loc = locMap?.get(raw.location_name.toLowerCase().trim())
            if (!loc) {
              errors.push(`Location "${raw.location_name}" not found in organization "${org.name}"`)
            } else {
              row.location_id = loc.id
            }
          }
        }
      }

      // Validate status
      if (raw.status && !VALID_STATUSES.includes(raw.status.toLowerCase())) {
        errors.push(`Invalid status "${raw.status}". Must be one of: ${VALID_STATUSES.join(', ')}`)
      }

      // Validate dates
      if (raw.installation_date && !isValidDate(raw.installation_date)) {
        errors.push(`Invalid installation_date "${raw.installation_date}". Use YYYY-MM-DD format`)
      }
      if (raw.warranty_expiration && !isValidDate(raw.warranty_expiration)) {
        errors.push(`Invalid warranty_expiration "${raw.warranty_expiration}". Use YYYY-MM-DD format`)
      }

      return row
    })

    // Separate valid and invalid rows
    const validRows = parsedRows.filter(r => r.errors.length === 0)
    const invalidRows = parsedRows.filter(r => r.errors.length > 0)

    // Insert valid rows
    const insertedDevices: Array<{ name: string; organization: string; location: string }> = []

    if (validRows.length > 0) {
      const insertData = validRows.map(row => ({
        org_id: row.org_id!,
        location_id: row.location_id!,
        name: row.raw.name,
        hardware_type: row.raw.hardware_type,
        manufacturer: row.raw.manufacturer || null,
        model_number: row.raw.model_number || null,
        serial_number: row.raw.serial_number || null,
        status: row.raw.status?.toLowerCase() || 'active',
        installation_date: row.raw.installation_date || null,
        warranty_expiration: row.raw.warranty_expiration || null,
        internal_notes: row.raw.internal_notes || null,
      }))

      const { data: inserted, error: insertError } = await adminSupabase
        .from('hardware')
        .insert(insertData)
        .select('name, org_id, location_id')

      if (insertError) {
        return NextResponse.json({ 
          error: `Database insert failed: ${insertError.message}` 
        }, { status: 500 })
      }

      // Map back to human-readable names for the response
      for (const device of inserted || []) {
        const orgName = [...orgMap.values()].find(o => o.id === device.org_id)?.name || 'Unknown'
        const locMap = locationsByOrg.get(device.org_id)
        const locName = locMap ? [...locMap.values()].find(l => l.id === device.location_id)?.name || 'Unknown' : 'Unknown'
        insertedDevices.push({ name: device.name, organization: orgName, location: locName })
      }
    }

    const result: UploadResult = {
      success: invalidRows.length === 0,
      totalRows: dataRows.length,
      insertedCount: validRows.length,
      errorCount: invalidRows.length,
      errors: invalidRows.map(r => ({ row: r.rowNumber, errors: r.errors })),
      insertedDevices,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('CSV upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
