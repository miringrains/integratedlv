'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Lock, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { TicketCommentWithUser } from '@/types/database'
import { toast } from 'sonner'

interface CommentSectionProps {
  ticketId: string
  comments: any[] // Updated to include attachments
  canManage: boolean
}

export function CommentSection({ ticketId, comments, canManage }: CommentSectionProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [localComments, setLocalComments] = useState(comments)

  // Update local comments when props change (e.g., after refresh)
  React.useEffect(() => {
    setLocalComments(comments)
  }, [comments])

  // Filter out internal comments for non-platform-admin users
  const visibleComments = canManage 
    ? localComments 
    : localComments.filter((c: any) => !c.is_internal)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 10485760)
    
    if (validFiles.length < files.length) {
      toast.error('Some files were skipped (only images under 10MB allowed)')
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 images
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() && selectedFiles.length === 0) return

    setLoading(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      
      formData.append('data', JSON.stringify({
        comment,
        is_internal: isInternal,
      }))

      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add reply' }))
        throw new Error(errorData.error || 'Failed to add reply')
      }

      const result = await response.json()
      
      // Optimistically add the new comment to the list
      // The API returns the comment with user info
      if (result && result.id) {
        setLocalComments(prev => [...prev, {
          ...result,
          attachments: selectedFiles.map((file, idx) => ({
            id: `temp-${idx}`,
            file_name: file.name,
            file_url: URL.createObjectURL(file),
            file_type: file.type,
            file_size: file.size,
          }))
        }])
      }
      
      setComment('')
      setIsInternal(false)
      setSelectedFiles([])
      
      // Show success message
      if (selectedFiles.length > 0) {
        toast.success(`Reply posted successfully${result.details ? ' (some files may have failed)' : ''}`)
      } else {
        toast.success('Reply posted successfully')
      }
      
      // Refresh in background to sync with server (for attachments that were uploaded)
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add reply. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Replies List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {visibleComments.map((c) => (
          <Card key={c.id} className={c.is_internal ? 'border-accent/50 bg-accent/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full border-2 border-gray-200 bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                  {c.user.avatar_url ? (
                    <img src={c.user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    `${c.user.first_name?.[0] || ''}${c.user.last_name?.[0] || ''}`
                  )}
                </div>
                
                {/* Reply Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {c.user.first_name} {c.user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(c.created_at)}
                      </p>
                    </div>
                    {c.is_internal && (
                      <div className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded">
                        <Lock className="h-3 w-3" />
                        Internal
                      </div>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3">{c.comment}</p>
                  
                  {/* Reply Attachments */}
                  {c.attachments && c.attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {c.attachments.map((attachment: any) => (
                        <a
                          key={attachment.id}
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-video rounded-lg overflow-hidden border border-border hover:border-accent shadow-sm hover:shadow-md transition-all"
                        >
                          <img
                            src={attachment.file_url}
                            alt={attachment.file_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-1 left-1 right-1">
                              <p className="text-white text-xs font-medium truncate">
                                {attachment.file_name}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {visibleComments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No replies yet. Be the first to respond.
          </p>
        )}
      </div>

      {/* Add Reply Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a reply..."
          rows={3}
          disabled={loading}
          className="resize-none"
        />
        
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || selectedFiles.length >= 5}
              className="h-8"
            >
              <Paperclip className="h-4 w-4 mr-1.5" />
              Attach {selectedFiles.length > 0 && `(${selectedFiles.length}/5)`}
            </Button>
            
          {canManage && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="internal"
                checked={isInternal}
                onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="internal" className="text-xs cursor-pointer text-muted-foreground">
                Internal note (Platform Admin only)
              </Label>
            </div>
          )}
          </div>
          <Button 
            type="submit" 
            disabled={loading || (!comment.trim() && selectedFiles.length === 0)} 
            size="sm" 
            className="bg-accent hover:bg-accent-dark h-9"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send Reply'}
          </Button>
        </div>
      </form>
    </div>
  )
}
