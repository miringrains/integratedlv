/**
 * Script to generate summaries for closed tickets that don't have them yet
 * Run with: npx tsx scripts/generate-missing-summaries.ts
 */

// Load environment variables - Next.js uses NEXT_PUBLIC_ prefix for client vars
// For server-side, we need the actual env vars
import dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try multiple env file locations
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })
dotenv.config() // Also try default .env

// Debug: Check if key env vars are loaded
console.log('Environment check:')
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅' : '❌')
console.log('')

import { createServiceRoleClient } from '../src/lib/supabase/server'
import { generateTicketSummaryAsync } from '../src/lib/ticket-summary'

async function generateMissingSummaries() {
  console.log('🔍 Finding closed tickets without summaries...')
  
  const supabase = createServiceRoleClient()
  
  // Find all closed tickets without summaries
  const { data: tickets, error } = await supabase
    .from('care_log_tickets')
    .select('id, ticket_number, title, closed_at')
    .eq('status', 'closed')
    .is('closed_summary', null)
    .order('closed_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching tickets:', error)
    process.exit(1)
  }

  if (!tickets || tickets.length === 0) {
    console.log('✅ All closed tickets already have summaries!')
    return
  }

  console.log(`📋 Found ${tickets.length} closed tickets without summaries`)
  console.log('')

  for (const ticket of tickets) {
    console.log(`🔄 Processing ticket ${ticket.ticket_number} (${ticket.id})...`)
    console.log(`   Title: ${ticket.title}`)
    
    try {
      const summary = await generateTicketSummaryAsync(ticket.id)
      
      if (summary) {
        console.log(`   ✅ Summary generated (${summary.length} characters)`)
      } else {
        console.log(`   ⚠️ Summary generation returned null (check logs above)`)
      }
    } catch (error) {
      console.error(`   ❌ Error generating summary:`, error)
    }
    
    console.log('')
  }

  console.log('✅ Done processing all tickets!')
}

generateMissingSummaries()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

