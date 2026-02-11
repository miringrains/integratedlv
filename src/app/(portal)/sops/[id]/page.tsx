import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSOPById, getHardwareForSOP } from '@/lib/queries/sops'
import { isOrgAdmin } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SOPDeleteButton } from '@/components/admin/SOPDeleteButton'

export default async function SOPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sop = await getSOPById(id)
  const canManage = await isOrgAdmin()

  if (!sop) notFound()

  const hardware = await getHardwareForSOP(id)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Knowledge Base', href: '/sops' },
        { label: sop.title },
      ]} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{sop.title}</h1>
            {!sop.is_active && (
              <Badge variant="outline">Inactive</Badge>
            )}
          </div>
          {sop.hardware_type && (
            <p className="text-muted-foreground mt-2">
              Hardware Type: {sop.hardware_type}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Badge>Version {sop.version}</Badge>
          {canManage && (
            <div className="flex gap-2">
              <Link href={`/sops/${id}/edit`}>
                <Button size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <SOPDeleteButton sopId={id} sopTitle={sop.title} />
            </div>
          )}
        </div>
      </div>

      {/* SOP Content */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {sop.content}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Associated Hardware */}
      <Card>
        <CardHeader>
          <CardTitle>Associated Hardware ({hardware.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {hardware.length > 0 ? (
            <div className="space-y-2">
              {hardware.map((hw) => (
                <Link 
                  key={hw.id}
                  href={`/hardware/${hw.id}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{hw.name}</p>
                      <p className="text-sm text-muted-foreground">{hw.hardware_type}</p>
                    </div>
                    <Badge variant={hw.status === 'active' ? 'default' : 'secondary'}>
                      {hw.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hardware associated with this SOP yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}





