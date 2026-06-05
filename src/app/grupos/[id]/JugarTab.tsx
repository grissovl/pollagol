'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { upsertPrediction } from '@/app/actions/grupo-detail'
import TeamFlag from '@/components/ui/TeamFlag'
import { createClient } from '@/lib/supabase/client'
import type { MatchData, PredictionData } from './types'

interface Props {
  groupId: string
  matches: MatchData[]
  initialPredictions: PredictionData[]
  paid: boolean
}

type PredState = {
  home: string
  away: string
  saving: boolean
  savedAt: number | null
  error: string | null
}

const phaseLabels: Record<string, string> = {
  group: 'Fase de Grupos',
  r32: '16avos de Final',
  r16: 'Octavos de Final',
  r8: 'Cuartos de Final',
  r4: 'Semifinales',
  r2: '3er y 4to Puesto',
  final: 'Final',
}

const phaseOrder = ['group', 'r32', 'r16', 'r8', 'r4', 'r2', 'final']

function isLocked(scheduledAt: string): boolean {
  const cutoff = new Date(scheduledAt)
  cutoff.setMinutes(cutoff.getMinutes() - 15)
  return new Date() >= cutoff
}

function formatMatchDate(scheduledAt: string): string {
  const d = new Date(scheduledAt)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const weekday = cap(
    d.toLocaleDateString('es', { weekday: 'short', timeZone: 'America/Santiago' }).replace('.', ''),
  )
  const day = d.toLocaleDateString('es', { day: 'numeric', timeZone: 'America/Santiago' })
  const month = cap(
    d.toLocaleDateString('es', { month: 'short', timeZone: 'America/Santiago' }).replace('.', ''),
  )
  const time = d.toLocaleTimeString('es', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Santiago',
  })
  return `${weekday} ${day} ${month} · ${time}h`
}

function isMatchFinished(match: MatchData): boolean {
  return match.status === 'finished' || (match.home_score !== null && match.away_score !== null)
}

export default function JugarTab({ groupId, matches, initialPredictions, paid }: Props) {
  const [autosave, setAutosave] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')

  const initMap = (): Record<number, PredState> => {
    const map: Record<number, PredState> = {}
    for (const m of matches) {
      const pred = initialPredictions.find((p) => p.match_id === m.id)
      map[m.id] = {
        home: pred?.home_score_pred?.toString() ?? '',
        away: pred?.away_score_pred?.toString() ?? '',
        saving: false,
        savedAt: pred ? Date.now() : null,
        error: null,
      }
    }
    return map
  }

  const [preds, setPreds] = useState<Record<number, PredState>>(initMap)
  const timeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // On mount: fetch fresh predictions from Supabase to override stale server props
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('predictions')
        .select('match_id, home_score_pred, away_score_pred, locked')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (!data) return
          setPreds((prev) => {
            const next = { ...prev }
            for (const p of data as PredictionData[]) {
              if (next[p.match_id]) {
                next[p.match_id] = {
                  ...next[p.match_id],
                  home: p.home_score_pred?.toString() ?? '',
                  away: p.away_score_pred?.toString() ?? '',
                  savedAt: Date.now(),
                }
              }
            }
            return next
          })
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = useCallback(
    async (matchId: number, home: string, away: string) => {
      const h = parseInt(home)
      const a = parseInt(away)
      if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return

      setPreds((prev) => ({ ...prev, [matchId]: { ...prev[matchId], saving: true, error: null } }))
      const res = await upsertPrediction(groupId, matchId, h, a)
      setPreds((prev) => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          saving: false,
          savedAt: res.error ? prev[matchId].savedAt : Date.now(),
          error: res.error ?? null,
        },
      }))
    },
    [groupId],
  )

  const handleChange = (matchId: number, field: 'home' | 'away', val: string) => {
    if (val !== '' && (isNaN(parseInt(val)) || parseInt(val) < 0)) return

    setPreds((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: val, error: null },
    }))

    if (!paid || !autosave) return

    const existing = timeouts.current.get(matchId)
    if (existing) clearTimeout(existing)

    const timeout = setTimeout(() => {
      const current = preds[matchId]
      const newHome = field === 'home' ? val : current.home
      const newAway = field === 'away' ? val : current.away
      save(matchId, newHome, newAway)
      timeouts.current.delete(matchId)
    }, 900)
    timeouts.current.set(matchId, timeout)
  }

  const handleManualSave = (matchId: number) => {
    const p = preds[matchId]
    save(matchId, p.home, p.away)
  }

  // Group matches by phase
  const matchesByPhase = matches.reduce<Record<string, MatchData[]>>((acc, m) => {
    if (!acc[m.phase]) acc[m.phase] = []
    acc[m.phase].push(m)
    return acc
  }, {})
  const sortedPhases = phaseOrder.filter((p) => matchesByPhase[p]?.length)

  // Apply filter
  const filterMatch = (m: MatchData): boolean => {
    const finished = isMatchFinished(m)
    const locked = isLocked(m.scheduled_at)
    if (filter === 'done') return finished || locked
    if (filter === 'pending') return !finished && !locked
    return true
  }

  const filteredCount = matches.filter(filterMatch).length

  return (
    <div className="space-y-4">
      {/* Payment pending banner */}
      {!paid && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>
            <strong>Tu pago está pendiente.</strong> Solo puedes ver las predicciones cuando el admin confirme tu pago.
          </span>
        </div>
      )}
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter buttons */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {(['all', 'pending', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Completados'}
            </button>
          ))}
        </div>

        {/* Autosave toggle */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => setAutosave((v) => !v)}
            className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${autosave ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${autosave ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </button>
          <span>Autoguardado</span>
        </div>
      </div>

      {filteredCount === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <p className="text-gray-500">No hay partidos en esta categoría.</p>
        </div>
      )}

      {/* Matches grouped by phase */}
      <div className="space-y-4">
        {sortedPhases.map((phase) => {
          const phaseMatches = (matchesByPhase[phase] ?? []).filter(filterMatch)
          if (phaseMatches.length === 0) return null

          return (
            <div key={phase}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {phaseLabels[phase] ?? phase}
              </h3>
              <div className="space-y-2">
                {phaseMatches.map((match) => {
                  const pred = preds[match.id]
                  const locked = isLocked(match.scheduled_at)
                  const finished = isMatchFinished(match)
                  const isDisabled = !paid || locked || finished

                  const homeName = match.home_team?.name ?? 'TBD'
                  const awayName = match.away_team?.name ?? 'TBD'

                  return (
                    <div
                      key={match.id}
                      className={`rounded-xl border bg-white p-4 shadow-sm ${isDisabled ? 'border-gray-100 opacity-80' : 'border-gray-200'}`}
                    >
                      {/* Date + lock */}
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">{formatMatchDate(match.scheduled_at)}</span>
                        {locked && (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <Lock className="h-3 w-3" />
                            {finished ? 'Finalizado' : 'Bloqueado'}
                          </span>
                        )}
                      </div>

                      {/* Teams + inputs */}
                      <div className="flex items-center gap-3">
                        {/* Home */}
                        <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
                          <span className="flex items-center justify-end gap-1.5 text-sm font-medium text-gray-800">
                            <span className="truncate">{homeName}</span>
                            {match.home_team && <TeamFlag teamName={homeName} size="md" />}
                          </span>
                          {finished && match.home_score !== null && (
                            <span className="text-xs text-gray-400">Real: {match.home_score}</span>
                          )}
                        </div>

                        {/* Score inputs */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={pred?.home ?? ''}
                            onChange={(e) => handleChange(match.id, 'home', e.target.value)}
                            disabled={isDisabled}
                            placeholder="-"
                            className="h-10 w-12 rounded-lg border border-gray-300 bg-white text-center text-lg font-bold text-gray-900 shadow-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-lg font-bold text-gray-400">:</span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={pred?.away ?? ''}
                            onChange={(e) => handleChange(match.id, 'away', e.target.value)}
                            disabled={isDisabled}
                            placeholder="-"
                            className="h-10 w-12 rounded-lg border border-gray-300 bg-white text-center text-lg font-bold text-gray-900 shadow-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Away */}
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                            {match.away_team && <TeamFlag teamName={awayName} size="md" />}
                            <span className="truncate">{awayName}</span>
                          </span>
                          {finished && match.away_score !== null && (
                            <span className="text-xs text-gray-400">Real: {match.away_score}</span>
                          )}
                        </div>
                      </div>

                      {/* Save status */}
                      {!isDisabled && (
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {pred?.saving && (
                              <span className="flex items-center gap-1 text-xs text-blue-500">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Guardando...
                              </span>
                            )}
                            {!pred?.saving && pred?.savedAt && !pred?.error && (
                              <span className="text-xs text-green-600">✓ Guardado</span>
                            )}
                            {pred?.error && (
                              <span className="text-xs text-red-500">{pred.error}</span>
                            )}
                          </div>
                          {!autosave && (
                            <button
                              onClick={() => handleManualSave(match.id)}
                              disabled={pred?.saving}
                              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              Guardar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
