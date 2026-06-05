'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calcularPuntajes } from './scoring'

type RulesUpdate = {
  pts_exact: number
  pts_winner: number
  pts_goal: number
  pts_unique: number
  pts_r32_bonus: number
  pts_r16_bonus: number
  pts_r8_bonus: number
  pts_r4_bonus: number
  pts_final_bonus: number
}

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

export async function updateOwnerPlays(
  groupId: string,
  ownerPlays: boolean,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase
      .from('groups')
      .update({ owner_plays: ownerPlays })
      .eq('id', groupId)
    if (error) return { error: errMsg(error) }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function updateGroupRules(
  groupId: string,
  rules: RulesUpdate,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase
      .from('group_rules')
      .update(rules)
      .eq('group_id', groupId)
    if (error) return { error: errMsg(error) }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function updateGroupPrizes(
  groupId: string,
  bet_amount: number,
  prize_pct_1st: number,
  prize_pct_2nd: number,
  prize_pct_3rd: number,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase
      .from('group_rules')
      .update({ bet_amount, prize_pct_1st, prize_pct_2nd, prize_pct_3rd })
      .eq('group_id', groupId)
    if (error) return { error: errMsg(error) }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function deleteGroup(groupId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) return { error: errMsg(error) }
    revalidatePath('/')
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function acceptMembership(
  membershipId: string,
  groupId: string,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase
      .from('group_memberships')
      .update({ status: 'accepted' })
      .eq('id', membershipId)
    if (error) return { error: errMsg(error) }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function rejectMembership(
  membershipId: string,
  groupId: string,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase
      .from('group_memberships')
      .update({ status: 'rejected' })
      .eq('id', membershipId)
    if (error) return { error: errMsg(error) }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function removeMember(
  membershipId: string,
  groupId: string,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase
      .from('group_memberships')
      .delete()
      .eq('id', membershipId)
    if (error) return { error: errMsg(error) }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function toggleMemberPayment(
  membershipId: string,
  groupId: string,
  paid: boolean,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase
      .from('group_memberships')
      .update({ paid })
      .eq('id', membershipId)
    if (error) return { error: errMsg(error) }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function setGroupMatches(
  groupId: string,
  matchIds: number[],
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)

    const { error: delError } = await supabase
      .from('group_matches')
      .delete()
      .eq('group_id', groupId)
    if (delError) return { error: errMsg(delError) }

    if (matchIds.length > 0) {
      const { error } = await supabase
        .from('group_matches')
        .insert(matchIds.map((match_id) => ({ group_id: groupId, match_id })))
      if (error) return { error: errMsg(error) }
    }

    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function saveMatchResult(
  groupId: string,
  matchId: number,
  homeScore: number,
  awayScore: number,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { data, error } = await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore, status: 'finished' })
      .eq('id', matchId)
      .select('id')
    if (error) return { error: errMsg(error) }
    if (!data || data.length === 0) {
      return { error: 'No se pudo actualizar el partido. Verifica que existe la policy RLS "matches_update_admin" en Supabase.' }
    }
    const calc = await calcularPuntajes(groupId)
    if (calc.error) return { error: calc.error }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function upsertSpecialBet(
  groupId: string,
  category: string,
  teamOrPlayer: string,
): Promise<{ error?: string }> {
  console.log('[upsertSpecialBet] →', { groupId, category, teamOrPlayer })
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const LOCK_DATE = new Date('2026-06-11T18:45:00Z')
  if (new Date() >= LOCK_DATE) return { error: 'Las apuestas especiales están bloqueadas' }

  // Check if row already exists to avoid onConflict constraint name issues
  const { data: existing, error: selectError } = await supabase
    .from('special_bets')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .eq('category', category)
    .maybeSingle()

  console.log('[upsertSpecialBet] existing row:', existing, 'selectError:', selectError)

  if (selectError) {
    console.error('[upsertSpecialBet] select error:', selectError)
    return { error: errMsg(selectError) }
  }

  if (existing) {
    // Omit updated_at — column may not exist in all deployments
    const { error } = await supabase
      .from('special_bets')
      .update({ team_or_player: teamOrPlayer })
      .eq('id', (existing as { id: string }).id)
    console.log('[upsertSpecialBet] update result error:', error)
    if (error) {
      console.error('[upsertSpecialBet] update error:', error)
      return { error: errMsg(error) }
    }
  } else {
    const { error } = await supabase.from('special_bets').insert({
      group_id: groupId,
      user_id: user.id,
      category,
      team_or_player: teamOrPlayer,
    })
    console.log('[upsertSpecialBet] insert result error:', error)
    if (error) {
      console.error('[upsertSpecialBet] insert error:', error)
      return { error: errMsg(error) }
    }
  }

  revalidatePath(`/grupos/${groupId}`)
  return {}
}

export async function saveSpecialResults(
  groupId: string,
  special_champion: string | null,
  special_golden_ball: string | null,
  special_golden_boot: string | null,
  special_golden_glove: string | null,
): Promise<{ error?: string }> {
  try {
    const { supabase } = await assertOwner(groupId)
    const { error } = await supabase
      .from('special_results')
      .upsert(
        {
          group_id: groupId,
          champion: special_champion,
          golden_ball: special_golden_ball,
          golden_boot: special_golden_boot,
          golden_glove: special_golden_glove,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'group_id' },
      )
    if (error) return { error: errMsg(error) }
    revalidatePath(`/grupos/${groupId}`)
    return {}
  } catch (e) {
    return { error: errMsg(e) }
  }
}

export async function upsertPrediction(
  groupId: string,
  matchId: number,
  homeScore: number | null,
  awayScore: number | null,
): Promise<{ error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: match } = await supabase
    .from('matches')
    .select('scheduled_at')
    .eq('id', matchId)
    .single()

  if (match) {
    const cutoff = new Date((match as { scheduled_at: string }).scheduled_at)
    cutoff.setMinutes(cutoff.getMinutes() - 15)
    if (new Date() >= cutoff) {
      return { error: 'Predicción bloqueada: el partido ya comenzó' }
    }
  }

  const { error } = await supabase.from('predictions').upsert(
    {
      group_id: groupId,
      match_id: matchId,
      user_id: user.id,
      home_score_pred: homeScore,
      away_score_pred: awayScore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'group_id,match_id,user_id' },
  )

  if (error) return { error: errMsg(error) }
  return {}
}
