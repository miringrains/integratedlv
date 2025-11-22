import { getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Mail, User, FileText, HelpCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function SupportPage() {
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  
  const orgId = profile?.org_memberships?.[0]?.org_id

  // Get active SOPs for this org
  const { data: sops } = await supabase
    .from('sops')
    .select('id, title, hardware_type, version')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('hardware_type')
    .limit(10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Support</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Resources and contact information for technical support
        </p>
      </div>

      {/* Account Manager Card */}
      <Card className="border-primary overflow-hidden">
        <CardHeader className="bg-primary py-3">
          <CardTitle className="text-sm text-primary-foreground font-semibold uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4" />
            Your Account Representative
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Name</p>
              <p className="text-lg font-semibold">Integrated LV Support Team</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </p>
                <a href="tel:+17025551234" className="text-accent hover:underline font-medium">
                  (702) 555-1234
                </a>
              </div>
              
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </p>
                <a href="mailto:support@integratedlowvoltage.com" className="text-accent hover:underline font-medium">
                  support@integratedlowvoltage.com
                </a>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Available Monday-Friday, 8 AM - 6 PM PST
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submit Ticket Card */}
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-accent" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Submit a support ticket for technical assistance with your hardware and systems.
            </p>
            <Link href="/tickets/new">
              <Button className="w-full bg-accent hover:bg-accent-dark">
                Create Support Ticket
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Knowledge Base Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse troubleshooting guides and standard operating procedures.
            </p>
            <Link href="/sops">
              <Button variant="outline" className="w-full">
                View SOPs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent SOPs */}
      {sops && sops.length > 0 && (
        <Card className="border-primary overflow-hidden">
          <CardHeader className="bg-primary py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-primary-foreground font-semibold uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Guides
              </CardTitle>
              <Link href="/sops">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary-foreground hover:bg-primary-foreground/10">
                  View All →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              {sops.map((sop) => (
                <Link key={sop.id} href={`/sops/${sop.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{sop.title}</p>
                        {sop.hardware_type && (
                          <p className="text-xs text-muted-foreground">{sop.hardware_type}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">v{sop.version}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

