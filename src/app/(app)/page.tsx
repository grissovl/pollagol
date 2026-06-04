import Link from 'next/link'
import { Users, Headphones, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import GroupSearchForm from './GroupSearchForm'

type GroupStatus = 'pending' | 'accepted' | 'rejected'

interface MemberGroup {
  status: GroupStatus
  groups: {
    id: string
    name: string
    code: string
  } | null
}

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

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Usuario'

  let memberGroups: MemberGroup[] = []

  if (user) {
    const { data } = await supabase
      .from('group_members')
      .select('status, groups(id, name, code)')
      .eq('user_id', user.id)

    if (data) {
      memberGroups = data as unknown as MemberGroup[]
    }
  }

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
        {/* Grupo Card */}
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

        {/* Soporte Card */}
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
            href="mailto:soporte@pollagol.app"
            className="mt-auto inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
          >
            Contactar Soporte
          </a>
        </div>

        {/* Buscar Grupo Card */}
        <div className="flex flex-col gap-4 rounded-xl bg-red-600 p-6 text-white shadow-md sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Buscar Grupo</h2>
          </div>
          <p className="text-sm text-red-100">
            Ingresa el código del grupo al que quieres unirte.
          </p>
          <GroupSearchForm />
        </div>
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
              {memberGroups.map((member, i) =>
                member.groups ? (
                  <li
                    key={member.groups.id ?? i}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.groups.name}</p>
                      <p className="text-xs text-gray-500">Código: {member.groups.code}</p>
                    </div>
                    <Badge variant={statusVariant[member.status]}>
                      {statusLabel[member.status]}
                    </Badge>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
