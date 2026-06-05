'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GroupRulesInput = {
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

function generateCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function supabaseErrMsg(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as Record<string, unknown>
    return `[${err.code ?? '?'}] ${err.message ?? JSON.stringify(e)}`
  }
  return String(e)
}

export async function createGroup(
  name: string,
  description: string,
  rules: GroupRulesInput,
  matchIds: number[]
): Promise<{ error?: string; groupId?: string }> {
  const supabase = createClient()

  // 1. Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[createGroup] Auth error:', authError)
    return { error: 'No autenticado. Vuelve a iniciar sesión.' }
  }

  // 2. Ensure profile exists (trigger may not have run if user pre-dates schema)
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      name:
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split('@')[0] ||
        'Usuario',
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  if (profileError) {
    // Non-fatal: profile might already exist and RLS blocks the select confirmation
    console.warn('[createGroup] Profile upsert warning:', supabaseErrMsg(profileError))
  }

  // 3. Insert group with a unique code (retry on unique_violation)
  let groupId: string | null = null

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        code,
        owner_id: user.id,
      })
      .select('id')
      .single()

    if (data) {
      groupId = (data as { id: string }).id
      break
    }

    const errCode = (error as unknown as Record<string, unknown> | null)?.code
    if (errCode !== '23505') {
      console.log('Error crear grupo:', JSON.stringify(error, null, 2))
      return { error: `[${errCode ?? '?'}] ${(error as { message?: string } | null)?.message ?? 'Error desconocido'}` }
    }
    // 23505 = unique_violation on code — retry
  }

  if (!groupId) {
    return { error: 'No se pudo generar un código único. Intenta de nuevo.' }
  }

  // 4. Insert rules
  const { error: rulesError } = await supabase
    .from('group_rules')
    .insert({ group_id: groupId, ...rules })

  if (rulesError) {
    console.error('[createGroup] Rules insert error:', supabaseErrMsg(rulesError))
    return { error: `Error al guardar las reglas: ${supabaseErrMsg(rulesError)}` }
  }

  // 5. Auto-join owner as accepted member
  const { error: memberError } = await supabase.from('group_memberships').insert({
    group_id: groupId,
    user_id: user.id,
    status: 'accepted',
    paid: false,
  })

  if (memberError) {
    console.error('[createGroup] Membership insert error:', supabaseErrMsg(memberError))
    // Non-fatal — continue even if membership insert fails
  }

  // 6. Get all knockout matches and add them automatically
  const { data: knockoutRaw, error: knockoutError } = await supabase
    .from('matches')
    .select('id')
    .neq('phase', 'group')

  if (knockoutError) {
    console.error('[createGroup] Knockout matches fetch error:', supabaseErrMsg(knockoutError))
  }

  const knockoutIds = ((knockoutRaw ?? []) as { id: number }[]).map((m) => m.id)
  const allMatchIds = Array.from(new Set([...matchIds, ...knockoutIds]))

  if (allMatchIds.length > 0) {
    const { error: gmError } = await supabase
      .from('group_matches')
      .insert(allMatchIds.map((match_id) => ({ group_id: groupId as string, match_id })))

    if (gmError) {
      console.error('[createGroup] Group matches insert error:', supabaseErrMsg(gmError))
      return { error: `Error al guardar los partidos: ${supabaseErrMsg(gmError)}` }
    }
  }

  revalidatePath('/')
  return { groupId }
}

export async function joinGroup(
  code: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('code', code.toLowerCase().trim())
    .maybeSingle()

  if (groupError) {
    console.error('[joinGroup] Group lookup error:', supabaseErrMsg(groupError))
  }
  if (!group) return { error: 'Código incorrecto' }

  const { data: existing } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', (group as { id: string }).id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { error: 'Ya eres miembro de este grupo' }

  const { error: insertError } = await supabase.from('group_memberships').insert({
    group_id: (group as { id: string }).id,
    user_id: user.id,
    status: 'pending',
  })

  if (insertError) {
    console.error('[joinGroup] Membership insert error:', supabaseErrMsg(insertError))
    return { error: 'Error al unirse al grupo' }
  }

  revalidatePath('/')
  return { success: true }
}
