export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GroupStatus = 'pending' | 'accepted' | 'rejected'
export type MatchPhase = 'group' | 'r32' | 'r16' | 'r8' | 'r4' | 'r2' | 'final'
export type MatchStatus = 'scheduled' | 'finished'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          avatar_url?: string | null
        }
      }
      teams: {
        Row: {
          id: number
          name: string
          flag_emoji: string | null
          group_name: string | null
        }
        Insert: {
          id?: number
          name: string
          flag_emoji?: string | null
          group_name?: string | null
        }
        Update: {
          name?: string
          flag_emoji?: string | null
          group_name?: string | null
        }
      }
      matches: {
        Row: {
          id: number
          phase: string
          group_name: string | null
          home_team_id: number | null
          away_team_id: number | null
          scheduled_at: string
          home_score: number | null
          away_score: number | null
          status: string
        }
        Insert: {
          id?: number
          phase: string
          group_name?: string | null
          home_team_id?: number | null
          away_team_id?: number | null
          scheduled_at: string
          home_score?: number | null
          away_score?: number | null
          status?: string
        }
        Update: {
          phase?: string
          group_name?: string | null
          home_team_id?: number | null
          away_team_id?: number | null
          scheduled_at?: string
          home_score?: number | null
          away_score?: number | null
          status?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          code: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          code: string
          owner_id: string
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          code?: string
        }
      }
      group_rules: {
        Row: {
          group_id: string
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
        }
        Insert: {
          group_id: string
          pts_exact?: number
          pts_winner?: number
          pts_goal?: number
          pts_unique?: number
          pts_r32_bonus?: number
          pts_r16_bonus?: number
          pts_r8_bonus?: number
          pts_r4_bonus?: number
          pts_final_bonus?: number
          bet_amount?: number
          prize_pct_1st?: number
          prize_pct_2nd?: number
          prize_pct_3rd?: number
        }
        Update: {
          pts_exact?: number
          pts_winner?: number
          pts_goal?: number
          pts_unique?: number
          pts_r32_bonus?: number
          pts_r16_bonus?: number
          pts_r8_bonus?: number
          pts_r4_bonus?: number
          pts_final_bonus?: number
          bet_amount?: number
          prize_pct_1st?: number
          prize_pct_2nd?: number
          prize_pct_3rd?: number
        }
      }
      group_memberships: {
        Row: {
          id: string
          group_id: string
          user_id: string
          subscription_number: number
          status: string
          paid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          subscription_number?: number
          status?: string
          paid?: boolean
          created_at?: string
        }
        Update: {
          status?: string
          paid?: boolean
        }
      }
      group_matches: {
        Row: {
          group_id: string
          match_id: number
        }
        Insert: {
          group_id: string
          match_id: number
        }
        Update: Record<string, never>
      }
      predictions: {
        Row: {
          id: string
          group_id: string
          match_id: number
          user_id: string
          home_score_pred: number | null
          away_score_pred: number | null
          locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          match_id: number
          user_id: string
          home_score_pred?: number | null
          away_score_pred?: number | null
          locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          home_score_pred?: number | null
          away_score_pred?: number | null
          locked?: boolean
          updated_at?: string
        }
      }
      prediction_scores: {
        Row: {
          prediction_id: string
          pts_exact: number
          pts_winner: number
          pts_goal: number
          pts_unique: number
          pts_bonus: number
          total: number
          calculated_at: string
        }
        Insert: {
          prediction_id: string
          pts_exact?: number
          pts_winner?: number
          pts_goal?: number
          pts_unique?: number
          pts_bonus?: number
          total?: number
          calculated_at?: string
        }
        Update: {
          pts_exact?: number
          pts_winner?: number
          pts_goal?: number
          pts_unique?: number
          pts_bonus?: number
          total?: number
          calculated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
