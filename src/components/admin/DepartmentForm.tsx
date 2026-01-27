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

interface DepartmentFormProps {
  department?: {
    id: string
    name: string
    description: string | null
    manager_id: string | null
  }
  orgId: string
  orgMembers: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }>
  onSuccess?: () => void
  onCancel?: () => void
}

export function DepartmentForm({ 
  department, 
  orgId, 
  orgMembers,
  onSuccess,
  onCancel 
}: DepartmentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEditing = !!department

  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
    manager_id: department?.manager_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Department name is required')
      return
    }

    setLoading(true)

    try {
      const url = isEditing 
        ? `/api/departments/${department.id}` 
        : '/api/departments'
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          manager_id: formData.manager_id || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save department' }))
        throw new Error(errorData.error || 'Failed to save department')
      }

      toast.success(isEditing ? 'Department updated' : 'Department created')
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save department')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Department' : 'New Department'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. IT Support, Sales, Operations"
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
              placeholder="Brief description of this department"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="manager">Department Manager</Label>
            <Select
              value={formData.manager_id}
              onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No manager assigned</SelectItem>
                {orgMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
