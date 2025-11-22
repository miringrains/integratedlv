import { requirePlatformAdmin, getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Shield, Mail, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function PlatformAdminsPage() {
  await requirePlatformAdmin()
  const profile = await getCurrentUserProfile()
  const isSuperAdmin = profile?.admin_level === 'super_admin'

  const supabase = await createClient()

  // Get all platform admins
  const { data: platformAdmins } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, admin_level, avatar_url, created_at')
    .eq('is_platform_admin', true)
    .order('admin_level')
    .order('email')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Platform Administrators</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage Integrated LV staff accounts and access levels
          </p>
        </div>
        {isSuperAdmin && (
          <Button className="bg-accent hover:bg-accent-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        )}
      </div>

      {/* Admins Table */}
      <Card className="overflow-hidden border-primary">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary border-b-0">
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Administrator</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Email</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Access Level</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Added</TableHead>
              {isSuperAdmin && (
                <TableHead className="text-right text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {platformAdmins?.map((admin) => (
              <TableRow key={admin.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full border-2 border-gray-200 bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold overflow-hidden">
                      {admin.avatar_url ? (
                        <img src={admin.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        `${admin.first_name?.[0] || ''}${admin.last_name?.[0] || ''}`
                      )}
                    </div>
                    <span className="font-semibold text-sm">
                      {admin.first_name} {admin.last_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {admin.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={
                    admin.admin_level === 'super_admin' ? 'bg-accent text-white' :
                    admin.admin_level === 'technician' ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }>
                    {admin.admin_level === 'super_admin' ? 'Super Admin' :
                     admin.admin_level === 'technician' ? 'Technician' :
                     'Read Only'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(admin.created_at).toLocaleDateString()}
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Access Level
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" disabled={admin.admin_level === 'super_admin'}>
                          Deactivate Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Info Box */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4 text-sm">
          <p className="font-semibold mb-2">Access Levels:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li><strong>Super Admin:</strong> Full system access, can manage other admins</li>
            <li><strong>Technician:</strong> Manage tickets, respond to clients, view all data</li>
            <li><strong>Read Only:</strong> View-only access for training or audit purposes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

