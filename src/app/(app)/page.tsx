import Link from 'next/link'
import { Users, Headphones, Search, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import GroupSearchForm from './GroupSearchForm'
import type { GroupStatus } from '@/types/database.types'

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

interface MemberGroupRow {
  status: GroupStatus
  group_id: string
  groups: { id: string; name: string; code: string } | null
  accumulator: number
}

type MembershipRaw = {
  status: string
  group_id: string
  groups: { id: string; name: string; code: string } | null
}

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Usuario'

  let memberGroups: MemberGroupRow[] = []

  if (user) {
    // 1. Get user's memberships with group info
    const { data: membershipsRaw } = (await supabase
      .from('group_memberships')
      .select('status, group_id, groups(id, name, code)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })) as { data: MembershipRaw[] | null }

    const memberships = membershipsRaw ?? []

    if (memberships.length > 0) {
      const groupIds = memberships.map((m) => m.group_id)

      // 2. Get rules and paid counts in parallel
      const [rulesResult, paidResult] = await Promise.all([
        supabase.from('group_rules').select('group_id, bet_amount').in('group_id', groupIds),
        supabase
          .from('group_memberships')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('paid', true),
      ])

      const rulesData = (rulesResult.data ?? []) as { group_id: string; bet_amount: number }[]
      const paidData = (paidResult.data ?? []) as { group_id: string }[]

      const betByGroup: Record<string, number> = {}
      rulesData.forEach((r) => { betByGroup[r.group_id] = r.bet_amount })

      const paidCountByGroup: Record<string, number> = {}
      paidData.forEach((m) => {
        paidCountByGroup[m.group_id] = (paidCountByGroup[m.group_id] ?? 0) + 1
      })

      memberGroups = memberships.map((m) => ({
        status: m.status as GroupStatus,
        group_id: m.group_id,
        groups: m.groups,
        accumulator: (betByGroup[m.group_id] ?? 0) * (paidCountByGroup[m.group_id] ?? 0),
      }))
    }
  }

  const isAdmin = user?.email === 'admin@pollagol.cl'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenid@, <span className="text-blue-700">{name}</span>!
        </h1>
        <p className="mt-1 text-gray-500">¿Qué quieres hacer hoy?</p>
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin ? (
          /* Crear Grupo — solo admin */
          <div className="flex flex-col gap-4 rounded-xl bg-blue-600 p-6 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Grupo</h2>
            </div>
            <p className="text-sm text-blue-100">
              Crea un grupo y compite con tus amigos prediciendo los resultados del mundial.
            </p>
            <Link
              href="/grupos/crear"
              className="mt-auto inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              Crear Grupo
            </Link>
          </div>
        ) : (
          /* Unirse a un grupo — participantes */
          <div className="flex flex-col gap-4 rounded-xl bg-indigo-600 p-6 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Unirse a un grupo</h2>
            </div>
            <p className="text-sm text-indigo-100">
              Ingresa el código que te compartió el organizador.
            </p>
            <GroupSearchForm />
          </div>
        )}

        {/* Soporte */}
        <div className="flex flex-col gap-4 rounded-xl bg-green-600 p-6 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2">
              <Headphones className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Soporte</h2>
          </div>
          <p className="text-sm text-green-100">
            ¿Tienes algún problema o consulta? Escríbenos y te ayudaremos a resolverlo.
          </p>
          <a
            href="https://wa.me/56987225152?text=Hola,%20necesito%20ayuda%20con%20PollaGol"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-green-600" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Contactar por WhatsApp
          </a>
        </div>

        {/* Buscar Grupo — solo admin (tiene su propio flujo de unirse arriba para participantes) */}
        {isAdmin && (
          <div className="flex flex-col gap-4 rounded-xl bg-red-600 p-6 text-white shadow-md sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Buscar Grupo</h2>
            </div>
            <p className="text-sm text-red-100">Ingresa el código del grupo al que quieres unirte.</p>
            <GroupSearchForm />
          </div>
        )}
      </div>

      {/* Mis Grupos */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">Mis Grupos</h2>

        {memberGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">Aún no perteneces a ningún grupo</p>
            <p className="mt-1 text-sm text-gray-400">
              Crea uno nuevo o únete con un código.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <ul className="divide-y divide-gray-100">
              {memberGroups.map((member, i) => {
                if (!member.groups) return null
                const isAccepted = member.status === 'accepted'
                const content = <GroupRow member={member} />

                return (
                  <li key={member.groups.id ?? i}>
                    {isAccepted ? (
                      <Link
                        href={`/grupos/${member.groups.id}`}
                        className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between px-5 py-4">
                        {content}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function GroupRow({ member }: { member: MemberGroupRow }) {
  if (!member.groups) return null

  return (
    <>
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">{member.groups.name}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>
            Código: <span className="font-mono">{member.groups.code}</span>
          </span>
          {member.accumulator > 0 && (
            <span className="font-medium text-green-700">
              Acumulado: ${member.accumulator.toLocaleString('es-CL')}
            </span>
          )}
        </div>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-2">
        <Badge variant={statusVariant[member.status]}>{statusLabel[member.status]}</Badge>
        {member.status === 'accepted' && <ChevronRight className="h-4 w-4 text-gray-400" />}
      </div>
    </>
  )
}
