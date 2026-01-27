'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, X } from 'lucide-react'

interface ContractFormProps {
  contract?: {
    id: string
    contract_number: string
    name: string
    description: string | null
    start_date: string
    end_date: string | null
    contract_value: number | null
    status: string
    terms: string | null
  }
  orgId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ContractForm({ 
  contract, 
  orgId, 
  onSuccess,
  onCancel 
}: ContractFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEditing = !!contract

  const [formData, setFormData] = useState({
    name: contract?.name || '',
    description: contract?.description || '',
    start_date: contract?.start_date || new Date().toISOString().split('T')[0],
    end_date: contract?.end_date || '',
    contract_value: contract?.contract_value?.toString() || '',
    status: contract?.status || 'active',
    terms: contract?.terms || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Contract name is required')
      return
    }

    if (!formData.start_date) {
      toast.error('Start date is required')
      return
    }

    setLoading(true)

    try {
      const url = isEditing 
        ? `/api/contracts/${contract.id}` 
        : '/api/contracts'
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
          status: formData.status,
          terms: formData.terms.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save contract' }))
        throw new Error(errorData.error || 'Failed to save contract')
      }

      toast.success(isEditing ? 'Contract updated' : 'Contract created')
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save contract')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Contract' : 'New Contract'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Contract Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Annual Support Agreement"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this contract"
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_value">Contract Value ($)</Label>
              <Input
                id="contract_value"
                type="number"
                step="0.01"
                value={formData.contract_value}
                onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              placeholder="Key terms and conditions"
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent-dark">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
