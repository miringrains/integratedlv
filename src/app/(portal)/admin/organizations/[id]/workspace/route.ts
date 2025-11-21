import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await context.params
  
  // Set org context in cookie/localStorage happens on client
  // For now, just redirect to dashboard with context
  redirect(`/home?workspace=${orgId}`)
}





