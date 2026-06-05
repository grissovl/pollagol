import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import GrupoPageClient from './GrupoPageClient'
import type {
  GrupoData, RulesData, MemberWithProfile, MatchData,
  PredictionData, LeaderboardEntry, MyMembership,
} from './types'

interface Props {
  params: { id: string }
}

type MatchRow = {
  id: number
  phase: string
  group_name: string | null
  scheduled_at: string
  home_score: number | null
  away_score: number | null
  status: string
  home_team_id: number | null
  away_team_id: number | null
}

type TeamRow = { id: number; name: string; flag_emoji: string | null }
type ScoreRow = { prediction_id: string; pts_exact: number; pts_winner: number; pts_goal: number; pts_unique: number; pts_bonus: number; total: number }

export default async function GrupoDetailPage({ params }: Props) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ── Group ──────────────────────────────────────────────────────
  const { data: groupRaw } = await supabase
    .from('groups')
    .select('id, name, description, code, owner_id, created_at')
    .eq('id', params.id)
    .single()

  if (!groupRaw) notFound()
  const group = groupRaw as GrupoData

  // ── Rules ──────────────────────────────────────────────────────
  const { data: rulesRaw } = await supabase
    .from('group_rules')
    .select('*')
    .eq('group_id', params.id)
    .single()

  const rules = (rulesRaw ?? {
    pts_exact: 5, pts_winner: 3, pts_goal: 1, pts_unique: 5,
    pts_r32_bonus: 10, pts_r16_bonus: 8, pts_r8_bonus: 4, pts_r4_bonus: 2, pts_final_bonus: 5,
    bet_amount: 0, prize_pct_1st: 70, prize_pct_2nd: 20, prize_pct_3rd: 10,
  }) as RulesData

  // ── User membership ────────────────────────────────────────────
  const { data: myMembershipRaw } = await supabase
    .from('group_memberships')
    .select('id, status, paid, subscription_number')
    .eq('group_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const myMembership = myMembershipRaw as MyMembership | null
  const isOwner = user.id === group.owner_id
  const isAccepted = myMembership?.status === 'accepted'

  // ── All memberships + profiles ─────────────────────────────────
  let members: MemberWithProfile[] = []
  if (isOwner || isAccepted) {
    const { data: membershipsRaw } = await supabase
      .from('group_memberships')
      .select('id, user_id, subscription_number, status, paid, created_at')
      .eq('group_id', params.id)
      .order('subscription_number')

    const userIds = (membershipsRaw ?? []).map((m) => (m as { user_id: string }).user_id)

    const { data: profilesRaw } = userIds.length > 0
      ? await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds)
      : { data: [] }

    const profileMap: Record<string, { name: string; avatar_url: string | null }> = {}
    for (const p of (profilesRaw ?? []) as { id: string; name: string; avatar_url: string | null }[]) {
      profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url }
    }

    members = ((membershipsRaw ?? []) as {
      id: string; user_id: string; subscription_number: number; status: string; paid: boolean; created_at: string
    }[]).map((m) => ({
      ...m,
      profile: profileMap[m.user_id] ?? { name: 'Usuario', avatar_url: null },
    }))
  }

  // ── All matches + teams ────────────────────────────────────────
  const [matchesResult, teamsResult, groupMatchesResult] = await Promise.all([
    supabase
      .from('matches')
      .select('id, phase, group_name, scheduled_at, home_score, away_score, status, home_team_id, away_team_id')
      .order('scheduled_at'),
    supabase.from('teams').select('id, name, flag_emoji'),
    supabase.from('group_matches').select('match_id').eq('group_id', params.id),
  ])

  const teamsById: Record<number, { name: string; flag_emoji: string | null }> = {}
  for (const t of ((teamsResult.data ?? []) as TeamRow[])) {
    teamsById[t.id] = { name: t.name, flag_emoji: t.flag_emoji }
  }

  const groupMatchIdSet = new Set(
    ((groupMatchesResult.data ?? []) as { match_id: number }[]).map((gm) => gm.match_id),
  )

  const allMatches: MatchData[] = ((matchesResult.data ?? []) as MatchRow[]).map((m) => ({
    id: m.id,
    phase: m.phase,
    group_name: m.group_name,
    scheduled_at: m.scheduled_at,
    home_score: m.home_score,
    away_score: m.away_score,
    status: m.status,
    home_team: m.home_team_id != null ? (teamsById[m.home_team_id] ?? null) : null,
    away_team: m.away_team_id != null ? (teamsById[m.away_team_id] ?? null) : null,
    in_group: groupMatchIdSet.has(m.id),
  }))

  const groupMatches = allMatches.filter((m) => m.in_group)

  // ── User predictions ───────────────────────────────────────────
  let myPredictions: PredictionData[] = []
  if (isAccepted || isOwner) {
    const { data: predsRaw } = await supabase
      .from('predictions')
      .select('id, match_id, home_score_pred, away_score_pred, locked')
      .eq('group_id', params.id)
      .eq('user_id', user.id)

    myPredictions = (predsRaw ?? []) as PredictionData[]
  }

  // ── Leaderboard ────────────────────────────────────────────────
  let leaderboard: LeaderboardEntry[] = []
  if (isAccepted || isOwner) {
    const { data: allPredsRaw } = await supabase
      .from('predictions')
      .select('id, user_id, match_id')
      .eq('group_id', params.id)

    const predIds = ((allPredsRaw ?? []) as { id: string }[]).map((p) => p.id)
    const predUserMap: Record<string, string> = {}
    for (const p of (allPredsRaw ?? []) as { id: string; user_id: string }[]) {
      predUserMap[p.id] = p.user_id
    }

    const { data: scoresRaw } = predIds.length > 0
      ? await supabase.from('prediction_scores').select('prediction_id, pts_exact, pts_winner, pts_goal, pts_unique, pts_bonus, total').in('prediction_id', predIds)
      : { data: [] }

    const userTotals: Record<string, { pts_exact: number; pts_winner: number; pts_goal: number; pts_unique: number; pts_bonus: number; total: number }> = {}

    for (const s of (scoresRaw ?? []) as ScoreRow[]) {
      const uid = predUserMap[s.prediction_id]
      if (!uid) continue
      if (!userTotals[uid]) {
        userTotals[uid] = { pts_exact: 0, pts_winner: 0, pts_goal: 0, pts_unique: 0, pts_bonus: 0, total: 0 }
      }
      userTotals[uid].pts_exact += s.pts_exact
      userTotals[uid].pts_winner += s.pts_winner
      userTotals[uid].pts_goal += s.pts_goal
      userTotals[uid].pts_unique += s.pts_unique
      userTotals[uid].pts_bonus += s.pts_bonus
      userTotals[uid].total += s.total
    }

    leaderboard = members
      .filter((m) => m.status === 'accepted')
      .map((m) => ({
        user_id: m.user_id,
        name: m.profile.name,
        avatar_url: m.profile.avatar_url,
        ...(userTotals[m.user_id] ?? { pts_exact: 0, pts_winner: 0, pts_goal: 0, pts_unique: 0, pts_bonus: 0, total: 0 }),
      }))
      .sort((a, b) => b.total - a.total)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-gray-600">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </Button>

      <GrupoPageClient
        group={group}
        rules={rules}
        myMembership={myMembership}
        isOwner={isOwner}
        userId={user.id}
        members={members}
        allMatches={allMatches}
        groupMatches={groupMatches}
        myPredictions={myPredictions}
        leaderboard={leaderboard}
      />
    </div>
  )
}
