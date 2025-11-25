'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/FileUpload'
import { SOPAcknowledgmentModal } from '@/components/sops/SOPAcknowledgmentModal'
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import type { Location, Hardware, SOP } from '@/types/database'

export default function NewTicketPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Data states
  const [locations, setLocations] = useState<Location[]>([])
  const [hardware, setHardware] = useState<Hardware[]>([])
  const [sops, setSOPs] = useState<SOP[]>([])
  const [orgId, setOrgId] = useState('')

  // Form states
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '')
  const [selectedHardware, setSelectedHardware] = useState(searchParams.get('hardware') || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [files, setFiles] = useState<File[]>([])

  // SOP modal state
  const [showSOPModal, setShowSOPModal] = useState(false)
  const [sopAcknowledged, setSOPAcknowledged] = useState(false)
  const [acknowledgedSOPIds, setAcknowledgedSOPIds] = useState<string[]>([])

  // Load data
  useEffect(() => {
    loadLocations()
    loadOrgId()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      loadHardware(selectedLocation)
    }
  }, [selectedLocation])

  useEffect(() => {
    if (selectedHardware) {
      loadSOPs(selectedHardware)
    }
  }, [selectedHardware])

  const loadOrgId = async () => {
    const response = await fetch('/api/user/org')
    const data = await response.json()
    setOrgId(data.org_id)
  }

  const loadLocations = async () => {
    const response = await fetch('/api/locations')
    const data = await response.json()
    setLocations(data)
  }

  const loadHardware = async (locationId: string) => {
    const response = await fetch(`/api/hardware?location=${locationId}`)
    const data = await response.json()
    setHardware(data)
  }

  const loadSOPs = async (hardwareId: string) => {
    const response = await fetch(`/api/hardware/${hardwareId}/sops`)
    const data = await response.json()
    setSOPs(data)
    
    // Auto-fill title
    const hw = hardware.find(h => h.id === hardwareId)
    if (hw) {
      setTitle(`${hw.name} - Issue`)
    }
  }

  const handleStep1Next = () => {
    if (!selectedLocation) {
      setError('Please select a location')
      return
    }
    setError('')
    setStep(2)
  }

  const handleStep2Next = () => {
    if (!selectedHardware) {
      setError('Please select hardware')
      return
    }
    setError('')
    
    // Show SOP modal if SOPs exist
    if (sops.length > 0) {
      setShowSOPModal(true)
    } else {
      setStep(3)
    }
  }

  const handleSOPAcknowledged = (acknowledgedIds: string[]) => {
    setSOPAcknowledged(true)
    setAcknowledgedSOPIds(acknowledgedIds)
    setShowSOPModal(false)
    setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get org_id from selected location (locations have org_id)
      const selectedLoc = locations.find(l => l.id === selectedLocation)
      if (!selectedLoc || !selectedLoc.org_id) {
        setError('Please select a valid location')
        setLoading(false)
        return
      }

      const formData = new FormData()
      
      formData.append('data', JSON.stringify({
        org_id: selectedLoc.org_id, // Use org_id from location, not from user
        location_id: selectedLocation,
        hardware_id: selectedHardware,
        title,
        description,
        priority,
        sop_acknowledged: sopAcknowledged,
        acknowledged_sop_ids: acknowledgedSOPIds,
      }))

      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to create ticket')

      const data = await response.json()
      toast.success(`Ticket ${data.ticket_number} created successfully!`, {
        description: 'Your support request has been submitted.',
        duration: 5000,
      })
      router.push(`/tickets/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const selectedHw = hardware.find(h => h.id === selectedHardware)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create Support Ticket</h1>
        <p className="text-muted-foreground mt-2">
          Step {step} of 3
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Step 1: Select Location */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <p className="text-sm text-muted-foreground">
              Which store or site is experiencing the issue?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleStep1Next} className="w-full">
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Hardware */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Hardware</CardTitle>
            <p className="text-sm text-muted-foreground">
              Which device is having the issue?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hardware">Hardware *</Label>
              <Select value={selectedHardware} onValueChange={setSelectedHardware}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hardware" />
                </SelectTrigger>
                <SelectContent>
                  {hardware.map((hw) => (
                    <SelectItem key={hw.id} value={hw.id}>
                      {hw.name} - {hw.hardware_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sops.length > 0 && selectedHardware && (
              <div className="bg-accent/10 border border-accent/30 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-accent mb-1">
                      Troubleshooting Steps Available
                    </p>
                    <p className="text-muted-foreground">
                      You'll need to review the troubleshooting procedures before submitting.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleStep2Next} className="flex-1">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Ticket Details */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Describe the issue and attach photos
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the problem..."
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Photos</Label>
                <FileUpload
                  onFilesSelected={setFiles}
                  maxFiles={10}
                  maxSizeMB={10}
                  disabled={loading}
                />
              </div>

              {sopAcknowledged && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  You have reviewed the troubleshooting procedures
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              disabled={loading}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating Ticket...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      )}

      {/* SOP Acknowledgment Modal */}
      {showSOPModal && selectedHw && (
        <SOPAcknowledgmentModal
          sops={sops}
          hardwareName={selectedHw.name}
          isOpen={showSOPModal}
          onAcknowledge={handleSOPAcknowledged}
          onCancel={() => {
            setShowSOPModal(false)
            router.back()
          }}
        />
      )}
    </div>
  )
}

