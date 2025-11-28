'use client'

import { useState } from 'react'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { OrgAdminUserActions } from '@/components/admin/OrgAdminUserActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, User, Mail, Shield, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AdminUsersClientProps {
  memberships: any[]
  orgId: string
  locations: Array<{ id: string; name: string }>
}

export function AdminUsersClient({ memberships, orgId, locations }: AdminUsersClientProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>My Team</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage users and permissions for your organization
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="bg-accent hover:bg-accent-dark">
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden border-primary">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary border-b-0">
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">User</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Email</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Role</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Joined</TableHead>
              <TableHead className="text-right text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No team members yet. Invite someone to get started.
                </TableCell>
              </TableRow>
            ) : (
              memberships.map((membership: any) => (
                <TableRow key={membership.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full border-2 border-gray-200 bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold overflow-hidden">
                        {membership.user.avatar_url ? (
                          <img src={membership.user.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          `${membership.user.first_name?.[0] || ''}${membership.user.last_name?.[0] || ''}`
                        )}
                      </div>
                      <span className="font-semibold text-sm">
                        {membership.user.first_name} {membership.user.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {membership.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      membership.role === 'org_admin' ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }>
                      {membership.role === 'org_admin' ? 'Admin' : 'Employee'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(membership.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <OrgAdminUserActions
                      userId={membership.user.id}
                      userEmail={membership.user.email}
                      userName={`${membership.user.first_name} ${membership.user.last_name}`}
                      orgId={orgId}
                      currentRole={membership.role as 'org_admin' | 'employee'}
                      locations={locations}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        orgId={orgId}
        locations={locations}
      />
    </div>
  )
}

