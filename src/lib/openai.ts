import OpenAI from 'openai'

// Initialize OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not configured - ticket summaries will not be generated')
    return null
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openaiClient
}

/**
 * Call OpenAI Chat API with fallback model chain
 * Models tried in order: gpt-5.1 -> gpt-5 -> gpt-4.1 -> gpt-4-turbo
 */
export async function callOpenAIChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    maxTokens?: number
    temperature?: number
    timeout?: number
  }
): Promise<string | null> {
  const client = getOpenAIClient()
  if (!client) {
    return null
  }

  // Model fallback chain - try newest models first, fallback to reliable ones
  // Note: GPT-5.1 might not be available via API yet, or may require API access enablement
  const models = [
    'gpt-5.1',           // Latest (Nov 2025) - may require API access enablement
    'gpt-5',             // GPT-5 (Aug 2025)
    'gpt-4o',            // GPT-4 Optimized (most reliable, widely available)
    'gpt-4-turbo',       // GPT-4 Turbo fallback
    'gpt-4',             // GPT-4 base (final fallback)
  ]
  const timeout = options?.timeout || 30000 // 30 seconds default

  for (const model of models) {
    try {
      // Use Promise.race to implement timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      })

      const response = await Promise.race([
        client.chat.completions.create({
          model,
          messages,
          max_tokens: options?.maxTokens || 500,
          temperature: options?.temperature || 0.7,
        }),
        timeoutPromise,
      ])

      const content = response.choices[0]?.message?.content
      if (content) {
        console.log(`✅ Successfully used OpenAI model: ${model}`)
        return content.trim()
      }
    } catch (error: any) {
      // If model not found, try next model
      if (error?.code === 'model_not_found' || error?.message?.includes('model') || error?.message?.includes('does not exist')) {
        console.warn(`⚠️ Model ${model} not available in your OpenAI account, trying next model...`)
        console.warn(`   Error: ${error.message}`)
        continue
      }

      // If timeout, log and return null (don't try other models)
      if (error?.message === 'Request timeout') {
        console.error(`OpenAI API timeout (${model})`)
        return null
      }

      // If rate limit, log and return null (don't try other models)
      if (error?.code === 'rate_limit_exceeded') {
        console.error(`OpenAI API rate limit exceeded (${model})`)
        return null
      }

      // For other errors, log and try next model
      console.error(`OpenAI API error (${model}):`, error.message)
    }
  }

  return null
}

/**
 * Format ticket data for AI prompt
 * Filters out internal comments and formats for OpenAI
 */
export function formatTicketDataForAI(ticket: {
  title: string
  description: string
  comments?: Array<{
    comment: string
    is_internal?: boolean
    is_public?: boolean
    created_at: string
    user?: { first_name?: string; last_name?: string }
  }>
  events?: Array<{
    event_type: string
    old_value: string | null
    new_value: string | null
    created_at: string
  }>
}): string {
  let formatted = `Ticket Title: ${ticket.title}\n\n`
  formatted += `Description: ${ticket.description}\n\n`

  // Add public comments only (exclude internal notes)
  if (ticket.comments && ticket.comments.length > 0) {
    const publicComments = ticket.comments.filter(
      (c) => !c.is_internal && (c.is_public !== false)
    )

    if (publicComments.length > 0) {
      formatted += 'Comments:\n'
      publicComments.forEach((comment, index) => {
        const userName = comment.user
          ? `${comment.user.first_name || ''} ${comment.user.last_name || ''}`.trim() || 'User'
          : 'User'
        formatted += `${index + 1}. [${userName}] ${comment.comment}\n`
      })
      formatted += '\n'
    }
  }

  // Add status changes
  if (ticket.events && ticket.events.length > 0) {
    const statusChanges = ticket.events.filter((e) => e.event_type === 'status_changed')
    if (statusChanges.length > 0) {
      formatted += 'Status History:\n'
      statusChanges.forEach((event) => {
        formatted += `- ${event.old_value || 'N/A'} → ${event.new_value || 'N/A'}\n`
      })
    }
  }

  return formatted
}

/**
 * Generate ticket summary using OpenAI
 */
export async function generateTicketSummary(ticketData: {
  title: string
  description: string
  comments?: Array<{
    comment: string
    is_internal?: boolean
    is_public?: boolean
    created_at: string
    user?: { first_name?: string; last_name?: string }
  }>
  events?: Array<{
    event_type: string
    old_value: string | null
    new_value: string | null
    created_at: string
  }>
}): Promise<string | null> {
  const formattedData = formatTicketDataForAI(ticketData)

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are an expert IT support agent summarizing a closed support ticket on behalf of Integrated Low Voltage. 

Write a professional, concise summary (2-4 sentences) that:
1. Clearly identifies the technical problem that was reported
2. Describes the resolution steps taken by our support team
3. Confirms the issue is resolved and the system is operational

Write from the perspective of our IT support team speaking to the customer. Use professional, technical language appropriate for IT support documentation. Be specific about what was wrong and how it was fixed. Avoid vague language like "the issue was resolved" - instead describe what was actually done.

Example tone: "The security camera at the main entrance was experiencing connectivity issues preventing video feed transmission. Our technician identified a faulty network cable connection and replaced the cable, restoring full camera functionality. The system is now operational and monitoring correctly."

Generate the summary now:`,
    },
    {
      role: 'user',
      content: formattedData,
    },
  ]

  return await callOpenAIChat(messages, {
    maxTokens: 300,
    temperature: 0.5, // Lower temperature for more consistent summaries
    timeout: 30000,
  })
}

