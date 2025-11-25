'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function GenerateSummariesPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    total: number
    successful: number
    failed: number
    errors: Array<{ ticket_id: string; ticket_number: string; error: string }>
  } | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/tickets/generate-all-summaries')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summaries')
      }

      setResults(data)
      
      if (data.successful > 0) {
        toast.success(`Successfully generated ${data.successful} summaries!`)
      }
      
      if (data.failed > 0) {
        toast.warning(`${data.failed} summaries failed to generate`)
      }
    } catch (error) {
      console.error('Error generating summaries:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate summaries')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Ticket Summaries
          </CardTitle>
          <CardDescription>
            Generate AI summaries for all closed tickets that don't have them yet.
            This will process all closed tickets and create summaries using OpenAI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating summaries...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate All Missing Summaries
              </>
            )}
          </Button>

          {results && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{results.total}</div>
                  <div className="text-sm text-muted-foreground">Total Tickets</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-5 w-5" />
                    {results.successful}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                    <XCircle className="h-5 w-5" />
                    {results.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Errors:</h3>
                  <div className="space-y-2">
                    {results.errors.map((error, idx) => (
                      <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm">
                        <div className="font-medium">{error.ticket_number}</div>
                        <div className="text-muted-foreground">{error.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

