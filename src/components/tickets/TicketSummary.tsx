import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

interface TicketSummaryProps {
  summary: string
}

export function TicketSummary({ summary }: TicketSummaryProps) {
  if (!summary) return null

  return (
    <Card className="border-primary overflow-hidden">
      <CardHeader className="bg-primary py-3">
        <CardTitle className="text-sm flex items-center gap-2 text-primary-foreground font-semibold uppercase tracking-wider">
          <FileText className="h-4 w-4" />
          Ticket Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-4">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {summary}
        </p>
      </CardContent>
    </Card>
  )
}

