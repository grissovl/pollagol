import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Run all diagnostics in parallel
  const [matchCount, matchSample, teamCount, teamSample, profileCheck] = await Promise.all([
    // ¿Cuántos partidos de fase de grupos hay?
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('phase', 'group'),

    // Muestra 3 partidos sin filtro (cualquier phase) para ver si la tabla tiene datos
    supabase.from('matches').select('id, phase, group_name, scheduled_at').limit(3),

    // ¿Cuántos equipos hay?
    supabase.from('teams').select('*', { count: 'exact', head: true }),

    // Muestra 3 equipos
    supabase.from('teams').select('id, name, group_name').limit(3),

    // ¿Existe el perfil del usuario actual?
    user
      ? supabase.from('profiles').select('id, name').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null, error: { message: 'no user session' } }),
  ])

  return NextResponse.json(
    {
      user: user ? { id: user.id, email: user.email } : null,

      matches: {
        group_phase_count: matchCount.count,
        count_error: matchCount.error,
        sample_3: matchSample.data,
        sample_error: matchSample.error,
      },

      teams: {
        count: teamCount.count,
        count_error: teamCount.error,
        sample_3: teamSample.data,
        sample_error: teamSample.error,
      },

      profile: {
        exists: !!profileCheck.data,
        data: profileCheck.data,
        error: profileCheck.error,
      },

      diagnosis: {
        seed_executed: (matchCount.count ?? 0) > 0 && (teamCount.count ?? 0) > 0,
        profile_ok: !!profileCheck.data,
        rls_blocking_matches: matchCount.error?.code === '42501',
        rls_blocking_teams: teamCount.error?.code === '42501',
      },
    },
    { status: 200 }
  )
}
