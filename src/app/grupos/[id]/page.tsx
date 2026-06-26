import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import GrupoPageClient from './GrupoPageClient'
import type {
  GrupoData, RulesData, MemberWithProfile, MatchData,
  PredictionData, LeaderboardEntry, MyMembership, SpecialBet,
  PhasePrediction, PhaseResult, TeamBasic, AllPredictionData,
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
    .select('id, name, description, code, owner_id, created_at, owner_plays')
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

  // ── Special results ────────────────────────────────────────────
  const { data: spRaw } = await supabase
    .from('special_results')
    .select('champion, golden_ball, golden_boot, golden_glove')
    .eq('group_id', params.id)
    .maybeSingle()

  if (spRaw) {
    const sp = spRaw as {
      champion: string | null
      golden_ball: string | null
      golden_boot: string | null
      golden_glove: string | null
    }
    Object.assign(rules, {
      special_champion: sp.champion,
      special_golden_ball: sp.golden_ball,
      special_golden_boot: sp.golden_boot,
      special_golden_glove: sp.golden_glove,
    })
  }

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

  // ── Group match IDs (fetched first to avoid type-mismatch in Set lookup) ──
  const { data: gmRaw } = await supabase
    .from('group_matches')
    .select('match_id')
    .eq('group_id', params.id)

  // Explicit Number() cast because bigint columns arrive as strings from PostgREST
  const groupMatchIdSet = new Set(
    ((gmRaw ?? []) as { match_id: number | string }[]).map((gm) => Number(gm.match_id)),
  )

  // ── All matches + teams ────────────────────────────────────────
  const [matchesResult, teamsResult] = await Promise.all([
    supabase
      .from('matches')
      .select('id, phase, group_name, scheduled_at, home_score, away_score, status, home_team_id, away_team_id')
      .order('scheduled_at'),
    supabase.from('teams').select('id, name, flag_emoji'),
  ])

  const teamsById: Record<number, { name: string; flag_emoji: string | null }> = {}
  for (const t of ((teamsResult.data ?? []) as TeamRow[])) {
    teamsById[Number(t.id)] = { name: t.name, flag_emoji: t.flag_emoji }
  }

  const allMatches: MatchData[] = ((matchesResult.data ?? []) as MatchRow[]).map((m) => ({
    id: m.id,
    phase: m.phase,
    group_name: m.group_name,
    scheduled_at: m.scheduled_at,
    home_score: m.home_score,
    away_score: m.away_score,
    status: m.status,
    home_team: m.home_team_id != null ? (teamsById[Number(m.home_team_id)] ?? null) : null,
    away_team: m.away_team_id != null ? (teamsById[Number(m.away_team_id)] ?? null) : null,
    in_group: groupMatchIdSet.has(Number(m.id)),
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

  // ── Phase predictions & results ────────────────────────────────
  let myPhasePredictions: PhasePrediction[] = []
  let allPhaseResults: PhaseResult[] = []

  if (isAccepted || isOwner) {
    const [ppResult, prResult] = await Promise.all([
      supabase
        .from('phase_predictions')
        .select('phase, team_ids, locked')
        .eq('group_id', params.id)
        .eq('user_id', user.id),
      supabase
        .from('phase_results')
        .select('phase, team_ids')
        .eq('group_id', params.id),
    ])
    myPhasePredictions = (ppResult.data ?? []) as PhasePrediction[]
    allPhaseResults = (prResult.data ?? []) as PhaseResult[]
  }

  // ── Special bets ───────────────────────────────────────────────
  let mySpecialBets: SpecialBet[] = []
  let allSpecialBets: SpecialBet[] = []
  let allBetsForLeaderboard: SpecialBet[] = []

  if (isAccepted || isOwner) {
    const { data: betsRaw } = await supabase
      .from('special_bets')
      .select('id, group_id, user_id, category, team_or_player, locked')
      .eq('group_id', params.id)
    allBetsForLeaderboard = (betsRaw ?? []) as SpecialBet[]
    mySpecialBets = allBetsForLeaderboard.filter((b) => b.user_id === user.id)
    if (isOwner) allSpecialBets = allBetsForLeaderboard
  }

  // ── Leaderboard ────────────────────────────────────────────────
  let leaderboard: LeaderboardEntry[] = []
  let allGroupPredictions: AllPredictionData[] = []
  if (isAccepted || isOwner) {
    const { data: allPredsRaw } = await supabase
      .from('predictions')
      .select('id, user_id, match_id, home_score_pred, away_score_pred')
      .eq('group_id', params.id)

    const predIds = ((allPredsRaw ?? []) as { id: string }[]).map((p) => p.id)
    const predUserMap: Record<string, string> = {}
    for (const p of (allPredsRaw ?? []) as { id: string; user_id: string }[]) {
      predUserMap[p.id] = p.user_id
    }

    // PostgREST uses GET with query params — batch to avoid URL length limits with many IDs
    const CHUNK = 200
    const scoresRaw: ScoreRow[] = []
    if (predIds.length > 0) {
      const chunks = Array.from({ length: Math.ceil(predIds.length / CHUNK) }, (_, i) =>
        predIds.slice(i * CHUNK, i * CHUNK + CHUNK),
      )
      const results = await Promise.all(
        chunks.map((chunk) =>
          supabase
            .from('prediction_scores')
            .select('prediction_id, pts_exact, pts_winner, pts_goal, pts_unique, pts_bonus, total')
            .in('prediction_id', chunk),
        ),
      )
      for (const r of results) scoresRaw.push(...((r.data ?? []) as ScoreRow[]))
    }

    const scoreByPredId: Record<string, ScoreRow> = {}
    for (const s of scoresRaw) {
      scoreByPredId[s.prediction_id] = s
    }
    allGroupPredictions = ((allPredsRaw ?? []) as {
      id: string; user_id: string; match_id: number; home_score_pred: number | null; away_score_pred: number | null
    }[]).map((p) => {
      const score = scoreByPredId[p.id]
      return {
        user_id: p.user_id,
        match_id: Number(p.match_id),
        home_score_pred: p.home_score_pred,
        away_score_pred: p.away_score_pred,
        pts_exact: score?.pts_exact ?? 0,
        pts_winner: score?.pts_winner ?? 0,
        pts_goal: score?.pts_goal ?? 0,
        pts_unique: score?.pts_unique ?? 0,
        pts_bonus: score?.pts_bonus ?? 0,
        total: score?.total ?? 0,
      }
    })

    const userTotals: Record<string, { pts_exact: number; pts_winner: number; pts_goal: number; pts_unique: number; pts_bonus: number; total: number }> = {}

    for (const s of scoresRaw) {
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

    // Add special bet points to userTotals
    const SPECIAL_PTS: Record<string, number> = {
      champion: 20, golden_ball: 15, golden_boot: 15, golden_glove: 10,
    }
    const specialResults: Record<string, string | null | undefined> = {
      champion: rules.special_champion,
      golden_ball: rules.special_golden_ball,
      golden_boot: rules.special_golden_boot,
      golden_glove: rules.special_golden_glove,
    }
    for (const bet of allBetsForLeaderboard) {
      const result = specialResults[bet.category]
      if (!result) continue
      if (bet.team_or_player.trim().toLowerCase() !== result.trim().toLowerCase()) continue
      const pts = SPECIAL_PTS[bet.category] ?? 0
      if (!userTotals[bet.user_id]) {
        userTotals[bet.user_id] = { pts_exact: 0, pts_winner: 0, pts_goal: 0, pts_unique: 0, pts_bonus: 0, total: 0 }
      }
      userTotals[bet.user_id].pts_bonus += pts
      userTotals[bet.user_id].total += pts
    }

    // Phase prediction bonuses
    const phaseResultsMapLb: Record<string, Set<number>> = {}
    for (const pr of allPhaseResults) {
      phaseResultsMapLb[pr.phase] = new Set((pr.team_ids ?? []).map(Number))
    }
    const phaseBonusPtsMap: Record<string, number> = {
      r32: rules.pts_r32_bonus, r16: rules.pts_r16_bonus,
      r8: rules.pts_r8_bonus, r4: rules.pts_r4_bonus, final: rules.pts_final_bonus,
    }
    const { data: allPpRaw } = await supabase
      .from('phase_predictions')
      .select('user_id, phase, team_ids')
      .eq('group_id', params.id)
    for (const pp of (allPpRaw ?? []) as { user_id: string; phase: string; team_ids: number[] }[]) {
      const results = phaseResultsMapLb[pp.phase]
      if (!results || results.size === 0) continue
      const allCorrect = (pp.team_ids ?? []).map(Number).every((id) => results.has(id))
      if (!allCorrect) continue
      const pts = phaseBonusPtsMap[pp.phase] ?? 0
      if (!pts) continue
      if (!userTotals[pp.user_id]) {
        userTotals[pp.user_id] = { pts_exact: 0, pts_winner: 0, pts_goal: 0, pts_unique: 0, pts_bonus: 0, total: 0 }
      }
      userTotals[pp.user_id].pts_bonus += pts
      userTotals[pp.user_id].total += pts
    }

    leaderboard = members
      .filter((m) => m.status === 'accepted' && m.paid)
      .filter((m) => group.owner_plays || m.user_id !== group.owner_id)
      .map((m) => ({
        user_id: m.user_id,
        name: m.profile.name,
        avatar_url: m.profile.avatar_url,
        ...(userTotals[m.user_id] ?? { pts_exact: 0, pts_winner: 0, pts_goal: 0, pts_unique: 0, pts_bonus: 0, total: 0 }),
      }))
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        if (b.pts_exact !== a.pts_exact) return b.pts_exact - a.pts_exact
        if (b.pts_winner !== a.pts_winner) return b.pts_winner - a.pts_winner
        return b.pts_goal - a.pts_goal
      })
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
        mySpecialBets={mySpecialBets}
        allSpecialBets={allSpecialBets}
        myPhasePredictions={myPhasePredictions}
        allPhaseResults={allPhaseResults}
        allTeams={(teamsResult.data ?? []).map((t) => ({ id: Number((t as TeamBasic).id), name: (t as TeamBasic).name, flag_emoji: (t as TeamBasic).flag_emoji }))}
        allGroupPredictions={allGroupPredictions}
      />
    </div>
  )
}
