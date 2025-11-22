import Link from 'next/link'
import { getSOPs } from '@/lib/queries/sops'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, AlertCircle } from 'lucide-react'
import { isPlatformAdmin } from '@/lib/auth'

export default async function SOPsPage() {
  const sops = await getSOPs({ isActive: true })
  const canManage = await isPlatformAdmin()

  // Group by hardware type
  const sopsByType = sops.reduce((acc, sop) => {
    const type = sop.hardware_type || 'General'
    if (!acc[type]) acc[type] = []
    acc[type].push(sop)
    return acc
  }, {} as Record<string, typeof sops>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Standard Operating Procedures</h1>
          <p className="text-muted-foreground mt-2">
            Troubleshooting guides and procedures for hardware support
          </p>
        </div>
        {canManage && (
          <Link href="/sops/new">
            <Button className="bg-accent hover:bg-accent-dark transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Create SOP
            </Button>
          </Link>
        )}
      </div>

      {/* Empty State */}
      {sops.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No SOPs yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Create standard operating procedures to guide troubleshooting and reduce support tickets
            </p>
            {canManage && (
              <Link href="/sops/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First SOP
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* SOPs Grouped by Hardware Type */}
      {Object.entries(sopsByType).map(([type, typeSops]) => (
        <div key={type} className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">{type}</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {typeSops.map((sop) => (
              <Link key={sop.id} href={`/sops/${sop.id}`}>
                <Card className="card-hover h-full group">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base group-hover:text-primary transition-colors duration-300">{sop.title}</CardTitle>
                      <FileText className="h-5 w-5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {sop.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <Badge variant="outline">v{sop.version}</Badge>
                      {sop.is_active && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

