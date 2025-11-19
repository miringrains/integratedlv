'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SOP, Hardware } from '@/types/database'

interface SOPFormProps {
  sop?: SOP
  orgId: string
  allHardware: Hardware[]
}

export function SOPForm({ sop, orgId, allHardware }: SOPFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: sop?.title || '',
    content: sop?.content || '',
    hardware_type: sop?.hardware_type || '',
    is_active: sop?.is_active ?? true,
  })

  const [selectedHardware, setSelectedHardware] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = sop ? `/api/sops/${sop.id}` : '/api/sops'
      const method = sop ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          org_id: orgId,
          hardware_ids: selectedHardware,
        }),
      })

      if (!response.ok) throw new Error('Failed to save SOP')

      const data = await response.json()
      router.push(`/sops/${data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleHardware = (hardwareId: string) => {
    setSelectedHardware(prev => 
      prev.includes(hardwareId)
        ? prev.filter(id => id !== hardwareId)
        : [...prev, hardwareId]
    )
  }

  // Group hardware by type
  const hardwareByType = allHardware.reduce((acc, hw) => {
    if (!acc[hw.hardware_type]) acc[hw.hardware_type] = []
    acc[hw.hardware_type].push(hw)
    return acc
  }, {} as Record<string, Hardware[]>)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>SOP Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Camera Offline - Basic Troubleshooting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hardware_type">Hardware Type</Label>
            <Input
              id="hardware_type"
              value={formData.hardware_type}
              onChange={(e) => setFormData({ ...formData, hardware_type: e.target.value })}
              placeholder="Security Camera, POS Terminal, etc."
            />
            <p className="text-xs text-muted-foreground">
              Optional: Group SOPs by hardware type
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Troubleshooting Steps *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="1. Check power connection&#10;2. Verify network cable&#10;3. Look for LED indicators&#10;4. Try power cycle..."
              rows={12}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use numbered steps for clear procedures
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_active: checked as boolean })
              }
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active (will be shown to users)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Associate with Hardware */}
      <Card>
        <CardHeader>
          <CardTitle>Associate with Hardware</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select which hardware devices should use this SOP
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(hardwareByType).map(([type, hardware]) => (
            <div key={type} className="space-y-2">
              <h3 className="font-semibold text-sm text-primary">{type}</h3>
              <div className="space-y-2 pl-4">
                {hardware.map((hw) => (
                  <div key={hw.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={hw.id}
                      checked={selectedHardware.includes(hw.id)}
                      onCheckedChange={() => toggleHardware(hw.id)}
                    />
                    <Label htmlFor={hw.id} className="cursor-pointer text-sm">
                      {hw.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {allHardware.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hardware available. Add hardware first to associate SOPs.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : sop ? 'Update SOP' : 'Create SOP'}
        </Button>
      </div>
    </form>
  )
}

