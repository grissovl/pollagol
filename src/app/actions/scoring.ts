'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function errMsg(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as Record<string, unknown>
    return String(err.message ?? JSON.stringify(e))
  }
  return String(e)
}

async function assertOwner(groupId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .single()

  if (!data || (data as { owner_id: string }).owner_id !== user.id) {
    throw new Error('No autorizado')
  }
  return { supabase, user }
}

export async function calcularPuntajes(
  groupId: string,
): Promise<{ error?: string; updated?: number }> {
  try {
    const { supabase } = await assertOwner(groupId)

    const { data: rulesRaw } = await supabase
      .from('group_rules')
      .select('pts_exact, pts_winner, pts_goal, pts_unique')
      .eq('group_id', groupId)
      .single()

    if (!rulesRaw) return { error: 'Reglas no encontradas' }
    const rules = rulesRaw as {
      pts_exact: number
      pts_winner: number
      pts_goal: number
      pts_unique: number
    }

    const { data: groupMatchIds } = await supabase
      .from('group_matches')
      .select('match_id')
      .eq('group_id', groupId)

    const matchIds = ((groupMatchIds ?? []) as { match_id: number }[]).map(
      (gm) => gm.match_id,
    )
    if (matchIds.length === 0) return { updated: 0 }

    const [{ data: predsRaw, error: predsError }, { data: matchesRaw }] =
      await Promise.all([
        supabase
          .from('predictions')
          .select('id, user_id, match_id, home_score_pred, away_score_pred')
          .eq('group_id', groupId)
          .in('match_id', matchIds),
        supabase
          .from('matches')
          .select('id, home_score, away_score')
          .in('id', matchIds)
          .not('home_score', 'is', null)
          .not('away_score', 'is', null),
      ])

    if (predsError) return { error: errMsg(predsError) }

    type MatchResult = { id: number; home_score: number; away_score: number }
    const matchResultMap: Record<number, MatchResult> = {}
    for (const m of (matchesRaw ?? []) as MatchResult[]) {
      matchResultMap[m.id] = m
    }

    type PredRow = {
      id: string
      user_id: string
      match_id: number
      home_score_pred: number | null
      away_score_pred: number | null
    }

    const preds = (predsRaw ?? []) as PredRow[]
    const predsWithResults = preds.filter((p) => matchResultMap[p.match_id] != null)
    if (predsWithResults.length === 0) return { updated: 0 }

    // Find which predictions nailed the exact score per match
    const exactByMatch: Record<number, string[]> = {}
    for (const p of predsWithResults) {
      const m = matchResultMap[p.match_id]
      if (p.home_score_pred === m.home_score && p.away_score_pred === m.away_score) {
        if (!exactByMatch[p.match_id]) exactByMatch[p.match_id] = []
        exactByMatch[p.match_id].push(p.id)
      }
    }

    const scores = predsWithResults.map((p) => {
      const match = matchResultMap[p.match_id]
      const hPred = p.home_score_pred
      const aPred = p.away_score_pred

      if (hPred === null || aPred === null) {
        return {
          prediction_id: p.id,
          pts_exact: 0,
          pts_winner: 0,
          pts_goal: 0,
          pts_unique: 0,
          pts_bonus: 0,
          total: 0,
        }
      }

      let pts_exact = 0
      let pts_winner = 0
      let pts_goal = 0
      let pts_unique = 0

      const isExact = hPred === match.home_score && aPred === match.away_score

      if (isExact) {
        pts_exact = rules.pts_exact
        // Unique: only one predictor in the group got this exact score
        if (exactByMatch[p.match_id]?.length === 1) {
          pts_unique = rules.pts_unique
        }
      } else {
        const actualResult = Math.sign(match.home_score - match.away_score)
        const predResult = Math.sign(hPred - aPred)
        if (actualResult === predResult) pts_winner = rules.pts_winner
        if (hPred === match.home_score) pts_goal += rules.pts_goal
        if (aPred === match.away_score) pts_goal += rules.pts_goal
      }

      const total = pts_exact + pts_winner + pts_goal + pts_unique
      return { prediction_id: p.id, pts_exact, pts_winner, pts_goal, pts_unique, pts_bonus: 0, total }
    })

    const { error: upsertError } = await supabase.from('prediction_scores').upsert(
      scores.map((s) => ({ ...s, calculated_at: new Date().toISOString() })),
      { onConflict: 'prediction_id' },
    )

    if (upsertError) return { error: errMsg(upsertError) }

    revalidatePath(`/grupos/${groupId}`)
    return { updated: scores.length }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

const PHASE_DEADLINES: Record<string, string> = {
  r32: '2026-06-28T18:45:00Z',
  r16: '2026-07-04T16:45:00Z',
  r8: '2026-07-09T19:45:00Z',
  r4: '2026-07-14T18:45:00Z',
  final: '2026-07-19T18:45:00Z',
}

export async function savePhasePrediction(
  groupId: string,
  phase: string,
  teamIds: number[],
): Promise<{ error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const deadline = PHASE_DEADLINES[phase]
    if (deadline && new Date() > new Date(deadline)) return { error: 'La fase ya está cerrada' }

    const { error } = await supabase.from('phase_predictions').upsert(
      { group_id: groupId, user_id: user.id, phase, team_ids: teamIds },
      { onConflict: 'group_id,user_id,phase' },
    )
    if (error) return { error: errMsg(error) }
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function savePhaseResults(
  groupId: string,
  phase: string,
  teamIds: number[],
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)

    const { error: resErr } = await supabase.from('phase_results').upsert(
      { group_id: groupId, phase, team_ids: teamIds, updated_at: new Date().toISOString() },
      { onConflict: 'group_id,phase' },
    )
    if (resErr) return { error: errMsg(resErr) }

    if (phase !== 'group') {
      await supabase
        .from('phase_predictions')
        .update({ locked: true })
        .eq('group_id', groupId)
        .eq('phase', phase)
    }

    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}
