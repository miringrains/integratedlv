'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Upload, Camera, Mail, Phone, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const response = await fetch('/api/user/me')
    const data = await response.json()
    setProfile(data)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      // Compress image
      const options = {
        maxSizeMB: 0.5, // Compress to max 500KB
        maxWidthOrHeight: 400, // Avatars don't need to be huge
        useWebWorker: true,
        fileType: 'image/jpeg',
      }
      
      toast.info('Compressing image...')
      const compressedFile = await imageCompression(file, options)
      
      // Upload to Supabase Storage
      const supabase = createClient()
      const fileExt = 'jpg'
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const response = await fetch(`/api/user/${profile.id}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })

      if (!response.ok) throw new Error('Failed to update avatar')

      toast.success('Avatar updated successfully!', {
        description: `Image compressed from ${(file.size / 1024).toFixed(0)}KB to ${(compressedFile.size / 1024).toFixed(0)}KB`,
      })
      
      await loadProfile()
      router.refresh()
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/user/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
        }),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      toast.success('Profile updated successfully!')
      router.refresh()
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and preferences
        </p>
      </div>

      {/* Avatar Upload - Clean Design */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Avatar Preview - Reasonable Size */}
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-2 border-gray-200 bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  `${profile.first_name?.[0] || 'U'}${profile.last_name?.[0] || 'U'}`
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Upload Button - Simple */}
            <div className="flex-1">
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-2"
                  disabled={uploading}
                  onClick={() => document.getElementById('avatar')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                JPG or PNG, max 5MB. Auto-compressed to 400x400.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <form onSubmit={handleUpdateProfile}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="badge-text text-muted-foreground">
                  First Name *
                </Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ''}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="border-2 h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="badge-text text-muted-foreground">
                  Last Name *
                </Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ''}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="border-2 h-11"
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="email" className="badge-text text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email Address
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted border-2 h-11 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="badge-text text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="border-2 h-11"
              />
            </div>

            <Separator />

            {/* Role Badge */}
            {profile.is_platform_admin && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <p className="text-sm font-semibold text-accent">Platform Administrator</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

