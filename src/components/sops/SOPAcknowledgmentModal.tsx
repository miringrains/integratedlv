'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, FileText } from 'lucide-react'
import type { SOP } from '@/types/database'

interface SOPAcknowledgmentModalProps {
  sops: SOP[]
  hardwareName: string
  isOpen: boolean
  onAcknowledge: (acknowledgedSopIds: string[]) => void
  onCancel: () => void
}

export function SOPAcknowledgmentModal({
  sops,
  hardwareName,
  isOpen,
  onAcknowledge,
  onCancel,
}: SOPAcknowledgmentModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50
    if (isNearBottom && !hasScrolled) {
      setHasScrolled(true)
    }
  }

  const handleAcknowledge = () => {
    if (acknowledged && hasScrolled) {
      onAcknowledge(sops.map(s => s.id))
    }
  }

  const canProceed = acknowledged && hasScrolled

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent" />
            Review Troubleshooting Steps
          </DialogTitle>
          <DialogDescription>
            Before creating a support ticket for <strong>{hardwareName}</strong>, 
            please review and follow these troubleshooting procedures.
          </DialogDescription>
        </DialogHeader>

        {/* SOPs Content - Scrollable */}
        <ScrollArea 
          className="flex-1 border rounded-lg p-4 bg-muted/30"
          onScrollCapture={handleScroll}
        >
          <div className="space-y-6">
            {sops.map((sop, index) => (
              <div key={sop.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary">{sop.title}</h3>
                    <div className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">
                      {sop.content}
                    </div>
                  </div>
                </div>
                {index < sops.length - 1 && (
                  <div className="border-b my-4" />
                )}
              </div>
            ))}
          </div>

          {!hasScrolled && sops.length > 0 && (
            <div className="text-center text-xs text-muted-foreground mt-4 animate-pulse">
              ↓ Scroll to bottom to continue ↓
            </div>
          )}
        </ScrollArea>

        {/* Acknowledgment Checkbox */}
        <div className="flex items-start space-x-3 pt-4 border-t">
          <Checkbox
            id="acknowledge"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
            disabled={!hasScrolled}
          />
          <Label 
            htmlFor="acknowledge" 
            className={`text-sm leading-normal cursor-pointer ${!hasScrolled ? 'text-muted-foreground' : ''}`}
          >
            I have reviewed and followed these troubleshooting steps. 
            The issue persists and I need technical support.
          </Label>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAcknowledge}
            disabled={!canProceed}
            className="min-w-[160px]"
          >
            {!hasScrolled ? 'Read Steps First' : 
             !acknowledged ? 'Acknowledge to Continue' :
             'Continue to Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}





