import { createClient } from '@/lib/supabase/server'
import CrearGrupoStepper, { type MatchWithTeams } from './CrearGrupoStepper'

type MatchRow = {
  id: number
  group_name: string | null
  scheduled_at: string
  home_team_id: number | null
  away_team_id: number | null
}

type TeamRow = {
  id: number
  name: string
  flag_emoji: string | null
}

export default async function CrearGrupoPage() {
  const supabase = createClient()

  // Two separate queries — avoids ambiguous FK hint issues with PostgREST.
  const [matchesResult, teamsResult] = await Promise.all([
    supabase
      .from('matches')
      .select('id, group_name, scheduled_at, home_team_id, away_team_id')
      .eq('phase', 'group')
      .order('group_name', { ascending: true })
      .order('scheduled_at', { ascending: true }),
    supabase.from('teams').select('id, name, flag_emoji'),
  ])

  const { data: matchesRaw, error: matchesError } = matchesResult
  const { data: teamsRaw, error: teamsError } = teamsResult

  if (matchesError) console.error('[CrearGrupoPage] matches error:', matchesError)
  if (teamsError) console.error('[CrearGrupoPage] teams error:', teamsError)

  // Build lookup map: teamId → {name, flag_emoji}
  const teamsById: Record<number, { name: string; flag_emoji: string | null }> = {}
  for (const t of (teamsRaw ?? []) as TeamRow[]) {
    teamsById[t.id] = { name: t.name, flag_emoji: t.flag_emoji }
  }

  // Join matches with team data
  const matches: MatchWithTeams[] = ((matchesRaw ?? []) as MatchRow[]).map((m) => ({
    id: m.id,
    group_name: m.group_name,
    scheduled_at: m.scheduled_at,
    home_team: m.home_team_id != null ? (teamsById[m.home_team_id] ?? null) : null,
    away_team: m.away_team_id != null ? (teamsById[m.away_team_id] ?? null) : null,
  }))

  const fetchError = matchesError?.message ?? teamsError?.message ?? undefined

  return <CrearGrupoStepper matches={matches} fetchError={fetchError} />
}
