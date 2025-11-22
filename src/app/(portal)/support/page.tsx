import { getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Mail, User, FileText, Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

export default async function SupportPage() {
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  
  const orgId = profile?.org_memberships?.[0]?.org_id

  // Get active SOPs
  const { data: sops } = await supabase
    .from('sops')
    .select('id, title, hardware_type, version')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('hardware_type')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Support</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Contact your account representative and access support resources
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Account Rep */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Manager Card */}
          <Card className="border-primary overflow-hidden">
            <CardHeader className="bg-primary py-3">
              <CardTitle className="text-sm text-primary-foreground font-semibold uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Account Representative
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 pb-5">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Name</p>
                  <p className="text-lg font-semibold">Integrated LV Support Team</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </p>
                    <a href="tel:+17025551234" className="text-accent hover:underline font-medium">
                      (702) 555-1234
                    </a>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </p>
                    <a href="mailto:support@integratedlowvoltage.com" className="text-accent hover:underline font-medium text-sm">
                      support@integratedlowvoltage.com
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Available Monday-Friday, 8 AM - 6 PM PST
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card className="overflow-hidden border-primary">
            <CardHeader className="bg-primary py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-primary-foreground font-semibold uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Knowledge Base
                </CardTitle>
                <Link href="/sops">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary-foreground hover:bg-primary-foreground/10">
                    View All →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              {sops && sops.length > 0 ? (
                <Table>
                  <TableBody>
                    {sops.map((sop) => (
                      <TableRow key={sop.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Link href={`/sops/${sop.id}`} className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{sop.title}</p>
                              {sop.hardware_type && (
                                <p className="text-xs text-muted-foreground">{sop.hardware_type}</p>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          v{sop.version}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No support guides available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-4">
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/tickets/new">
                <Button className="w-full bg-accent hover:bg-accent-dark justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Support Ticket
                </Button>
              </Link>
              <Link href="/sops">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Guides
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
