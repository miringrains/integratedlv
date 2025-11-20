import { notFound } from 'next/navigation'
import { requireOrgAdmin } from '@/lib/auth'
import { getSOPById } from '@/lib/queries/sops'
import { getHardware } from '@/lib/queries/hardware'
import { SOPForm } from '@/components/forms/SOPForm'

export default async function EditSOPPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireOrgAdmin()
  const { id } = await params
  const sop = await getSOPById(id)
  const hardware = await getHardware()

  if (!sop) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit SOP</h1>
        <p className="text-muted-foreground mt-2">
          Update {sop.title}
        </p>
      </div>

      <SOPForm sop={sop} orgId={sop.org_id} allHardware={hardware} />
    </div>
  )
}


