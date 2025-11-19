import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, User, Mail, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminUsersPage() {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const orgId = profile?.org_memberships?.[0]?.org_id

  const supabase = await createClient()

  // Get all users in the organization
  const { data: memberships } = await supabase
    .from('org_memberships')
    .select(`
      id,
      role,
      created_at,
      user:profiles (*)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users and permissions for your organization
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships?.map((membership: any) => (
                <TableRow key={membership.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium">
                        {membership.user.first_name} {membership.user.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {membership.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      membership.role === 'org_admin' ? 'default' :
                      membership.role === 'platform_admin' ? 'destructive' :
                      'outline'
                    }>
                      {membership.role === 'org_admin' ? 'Admin' :
                       membership.role === 'platform_admin' ? 'Platform Admin' :
                       'Employee'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(membership.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">Manage</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{memberships?.length || 0}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">
                  {memberships?.filter((m: any) => m.role === 'org_admin').length || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">
                  {memberships?.filter((m: any) => m.role === 'employee').length || 0}
                </p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

