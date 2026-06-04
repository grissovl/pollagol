export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GroupStatus = 'pending' | 'accepted' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          code: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          owner_id: string
          created_at?: string
        }
        Update: {
          name?: string
          code?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          status: GroupStatus
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          status?: GroupStatus
          created_at?: string
        }
        Update: {
          status?: GroupStatus
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
