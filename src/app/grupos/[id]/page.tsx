import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GroupStatus } from '@/types/database.types'

interface Props {
  params: { id: string }
}

type GroupRow = {
  id: string
  name: string
  description: string | null
  code: string
  owner_id: string
  created_at: string
}

type MembershipRow = { status: string } | null

const statusLabel: Record<GroupStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

const statusVariant: Record<GroupStatus, 'pending' | 'accepted' | 'rejected'> = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'rejected',
}

export default async function GrupoDetailPage({ params }: Props) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: groupRaw } = (await supabase
    .from('groups')
    .select('id, name, description, code, owner_id, created_at')
    .eq('id', params.id)
    .single()) as { data: GroupRow | null }

  if (!groupRaw) notFound()
  const group = groupRaw

  // Current user's membership
  const membershipResult = user
    ? await supabase
        .from('group_memberships')
        .select('status')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : null

  const myMembership = (membershipResult?.data ?? null) as MembershipRow

  // Accepted member count
  const { count: memberCount } = await supabase
    .from('group_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', group.id)
    .eq('status', 'accepted')

  const memberStatus = myMembership ? (myMembership.status as GroupStatus) : undefined
  const isOwner = user?.id === group.owner_id
  const isAccepted = memberStatus === 'accepted'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-gray-600">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </Button>

      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.description && (
              <p className="mt-1 text-gray-500">{group.description}</p>
            )}
          </div>
          {memberStatus && (
            <Badge variant={statusVariant[memberStatus]}>
              {statusLabel[memberStatus]}
            </Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Copy className="h-4 w-4 text-gray-400" />
            <span className="font-mono font-semibold tracking-wider text-gray-800">
              {group.code}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-400" />
            <span>
              {memberCount ?? 0} miembro{(memberCount ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
          {isOwner && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              Organizador
            </span>
          )}
        </div>
      </div>

      {/* Status notices */}
      {memberStatus === 'pending' && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-800">
          <p className="font-semibold">Tu solicitud está pendiente</p>
          <p className="mt-1">El organizador debe aceptarte para que puedas participar.</p>
        </div>
      )}

      {memberStatus === 'rejected' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">Tu solicitud fue rechazada</p>
          <p className="mt-1">Contacta al organizador para más información.</p>
        </div>
      )}

      {/* Content for accepted members / owner */}
      {(isAccepted || isOwner) && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="font-medium text-gray-500">Próximamente</p>
          <p className="mt-1 text-sm text-gray-400">
            Fixture, predicciones y tabla de posiciones estarán disponibles pronto.
          </p>
        </div>
      )}
    </div>
  )
}
