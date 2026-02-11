import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/hardware/csv-template
 * Returns a CSV template file for bulk device upload.
 * Includes header row + 2 example rows with real org/location names from the database.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const headers = [
      'organization_name',
      'location_name',
      'name',
      'hardware_type',
      'manufacturer',
      'model_number',
      'serial_number',
      'status',
      'installation_date',
      'warranty_expiration',
      'internal_notes',
    ]

    // Fetch a real org + location to make the example realistic
    const { data: sampleLocation } = await supabase
      .from('locations')
      .select('name, organizations(name)')
      .limit(1)
      .single()

    const sampleOrg = (sampleLocation as any)?.organizations?.name || 'Acme Corp'
    const sampleLoc = sampleLocation?.name || 'Main Office'

    const exampleRows = [
      [sampleOrg, sampleLoc, 'Ubiquiti Dream Machine Pro', 'Router', 'Ubiquiti', 'UDM-Pro', 'SN-2024-001', 'active', '2024-06-15', '2027-06-15', 'Primary gateway router'],
      [sampleOrg, sampleLoc, 'UniFi Switch 24 PoE', 'Switch', 'Ubiquiti', 'USW-24-POE', 'SN-2024-002', 'active', '2024-06-15', '2027-06-15', ''],
    ]

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(',')),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="device-upload-template.csv"',
      },
    })
  } catch (error) {
    console.error('CSV template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
