export type GrupoData = {
  id: string
  name: string
  description: string | null
  code: string
  owner_id: string
  created_at: string
  owner_plays: boolean
}

export type RulesData = {
  pts_exact: number
  pts_winner: number
  pts_goal: number
  pts_unique: number
  pts_r32_bonus: number
  pts_r16_bonus: number
  pts_r8_bonus: number
  pts_r4_bonus: number
  pts_final_bonus: number
  bet_amount: number
  prize_pct_1st: number
  prize_pct_2nd: number
  prize_pct_3rd: number
  special_champion?: string | null
  special_golden_ball?: string | null
  special_golden_boot?: string | null
  special_golden_glove?: string | null
}

export type MyMembership = {
  id: string
  status: string
  paid: boolean
  subscription_number: number
}

export type MemberWithProfile = {
  id: string
  user_id: string
  subscription_number: number
  status: string
  paid: boolean
  created_at: string
  profile: { name: string; avatar_url: string | null }
}

export type MatchData = {
  id: number
  phase: string
  group_name: string | null
  scheduled_at: string
  home_score: number | null
  away_score: number | null
  status: string
  home_team: { name: string; flag_emoji: string | null } | null
  away_team: { name: string; flag_emoji: string | null } | null
  in_group: boolean
}

export type PredictionData = {
  id: string
  match_id: number
  home_score_pred: number | null
  away_score_pred: number | null
  locked: boolean
}

export type LeaderboardEntry = {
  user_id: string
  name: string
  avatar_url: string | null
  total: number
  pts_exact: number
  pts_winner: number
  pts_goal: number
  pts_unique: number
  pts_bonus: number
}

export type SpecialBet = {
  id: string
  group_id: string
  user_id: string
  category: 'champion' | 'golden_ball' | 'golden_boot' | 'golden_glove'
  team_or_player: string
  locked: boolean
}

export type PhasePrediction = {
  phase: string
  team_ids: number[]
  locked: boolean
}

export type PhaseResult = {
  phase: string
  team_ids: number[]
}

export type TeamBasic = {
  id: number
  name: string
  flag_emoji: string | null
}
