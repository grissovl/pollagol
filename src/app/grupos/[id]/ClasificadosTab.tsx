'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, Lock, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TeamFlag from '@/components/ui/TeamFlag'
import { savePhasePrediction, savePhaseResults } from '@/app/actions/scoring'
import type { RulesData, PhasePrediction, PhaseResult, TeamBasic } from './types'

interface Props {
  groupId: string
  isOwner: boolean
  ownerPlays: boolean
  paid: boolean
  rules: RulesData
  myPhasePredictions: PhasePrediction[]
  allPhaseResults: PhaseResult[]
  allTeams: TeamBasic[]
}

type BonusPtsKey = 'pts_r32_bonus' | 'pts_r16_bonus' | 'pts_r8_bonus' | 'pts_r4_bonus' | 'pts_final_bonus'

const PHASES: {
  phase: string
  label: string
  bonusPtsKey: BonusPtsKey
  picks: number
  prevPhase: string
  deadline: Date
}[] = [
  { phase: 'r32', label: '16avos de Final', bonusPtsKey: 'pts_r32_bonus', picks: 16, prevPhase: 'group', deadline: new Date('2026-06-28T18:45:00Z') },
  { phase: 'r16', label: 'Octavos de Final', bonusPtsKey: 'pts_r16_bonus', picks: 8, prevPhase: 'r32', deadline: new Date('2026-07-04T16:45:00Z') },
  { phase: 'r8', label: 'Cuartos de Final', bonusPtsKey: 'pts_r8_bonus', picks: 4, prevPhase: 'r16', deadline: new Date('2026-07-09T19:45:00Z') },
  { phase: 'r4', label: 'Semifinales', bonusPtsKey: 'pts_r4_bonus', picks: 2, prevPhase: 'r8', deadline: new Date('2026-07-14T18:45:00Z') },
  { phase: 'final', label: 'Final', bonusPtsKey: 'pts_final_bonus', picks: 1, prevPhase: 'r4', deadline: new Date('2026-07-19T18:45:00Z') },
]

const ADMIN_PHASES: { phase: string; label: string; count: number; prevPhase: string | null }[] = [
  { phase: 'group', label: 'Clasificados de grupos', count: 32, prevPhase: null },
  { phase: 'r32', label: 'Clasificados de 16avos', count: 16, prevPhase: 'group' },
  { phase: 'r16', label: 'Clasificados de octavos', count: 8, prevPhase: 'r32' },
  { phase: 'r8', label: 'Clasificados de cuartos', count: 4, prevPhase: 'r16' },
  { phase: 'r4', label: 'Clasificados de semis', count: 2, prevPhase: 'r8' },
  { phase: 'final', label: 'Campeón', count: 1, prevPhase: 'r4' },
]

export default function ClasificadosTab({
  groupId, isOwner, paid, rules,
  myPhasePredictions, allPhaseResults, allTeams,
}: Props) {
  const now = new Date()

  const phaseResultsMap = new Map<string, Set<number>>(
    allPhaseResults.map((r) => [r.phase, new Set<number>((r.team_ids ?? []).map(Number))]),
  )
  const myPredMap = new Map<string, PhasePrediction>(
    myPhasePredictions.map((p) => [p.phase, p]),
  )
  const teamsById = new Map<number, TeamBasic>(allTeams.map((t) => [t.id, t]))

  function getAvailableTeams(prevPhase: string): TeamBasic[] {
    const ids = phaseResultsMap.get(prevPhase)
    if (!ids || ids.size === 0) return []
    return Array.from(ids).map((id) => teamsById.get(id)).filter(Boolean) as TeamBasic[]
  }

  function getStatus(cfg: typeof PHASES[number]) {
    const prevResults = phaseResultsMap.get(cfg.prevPhase)
    if (!prevResults || prevResults.size === 0) return 'pending' as const
    const myPred = myPredMap.get(cfg.phase)
    if (myPred?.locked || now > cfg.deadline) return 'closed' as const
    return 'open' as const
  }

  // Per-phase participant selection state (keyed by phase)
  const [selections, setSelections] = useState<Record<string, Set<number>>>(() => {
    const init: Record<string, Set<number>> = {}
    for (const p of myPhasePredictions) {
      init[p.phase] = new Set((p.team_ids ?? []).map(Number))
    }
    return init
  })
  const [saveMsgs, setSaveMsgs] = useState<Record<string, { ok?: boolean; text: string } | undefined>>({})
  const [saving, setSaving] = useState<Set<string>>(new Set())

  async function handleToggleTeam(phase: string, teamId: number, picks: number) {
    const current = new Set(selections[phase] ?? [])
    if (current.has(teamId)) {
      current.delete(teamId)
    } else {
      if (current.size >= picks) return
      current.add(teamId)
    }
    setSelections((prev) => ({ ...prev, [phase]: current }))
    setSaving((prev) => new Set(prev).add(phase))
    const res = await savePhasePrediction(groupId, phase, Array.from(current))
    setSaving((prev) => { const n = new Set(prev); n.delete(phase); return n })
    if (res.error) {
      setSaveMsgs((prev) => ({ ...prev, [phase]: { text: res.error! } }))
    } else {
      setSaveMsgs((prev) => ({ ...prev, [phase]: undefined }))
    }
  }

  // Admin section state
  const [adminSelections, setAdminSelections] = useState<Record<string, Set<number>>>(() => {
    const init: Record<string, Set<number>> = {}
    for (const r of allPhaseResults) {
      init[r.phase] = new Set<number>((r.team_ids ?? []).map(Number))
    }
    return init
  })
  const [adminMsgs, setAdminMsgs] = useState<Record<string, { ok?: boolean; text: string } | undefined>>({})
  const [adminExpanded, setAdminExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleAdminTeam(phase: string, teamId: number, maxCount: number) {
    setAdminSelections((prev) => {
      const current = new Set(prev[phase] ?? [])
      if (current.has(teamId)) {
        current.delete(teamId)
      } else {
        if (current.size >= maxCount) return prev
        current.add(teamId)
      }
      return { ...prev, [phase]: current }
    })
  }

  function handleSavePhaseResults(phase: string) {
    const ids = Array.from(adminSelections[phase] ?? [])
    setAdminMsgs((prev) => ({ ...prev, [phase]: undefined }))
    startTransition(async () => {
      const res = await savePhaseResults(groupId, phase, ids)
      if (res.error) {
        setAdminMsgs((prev) => ({ ...prev, [phase]: { text: res.error! } }))
      } else {
        setAdminMsgs((prev) => ({ ...prev, [phase]: { ok: true, text: 'Clasificados guardados' } }))
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Admin section: enter all phase results */}
      {isOwner && (
        <div className="rounded-xl border border-amber-200 bg-amber-50">
          <button
            type="button"
            onClick={() => setAdminExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-amber-800"
          >
            <span>Ingresar clasificados reales</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${adminExpanded ? 'rotate-180' : ''}`} />
          </button>

          {adminExpanded && (
            <div className="border-t border-amber-200 p-4 space-y-6">
              {ADMIN_PHASES.map((ap) => {
                const poolIds = ap.prevPhase ? phaseResultsMap.get(ap.prevPhase) : null
                const pool: TeamBasic[] = poolIds && poolIds.size > 0
                  ? Array.from(poolIds).map((id) => teamsById.get(id)).filter(Boolean) as TeamBasic[]
                  : allTeams
                const selected = adminSelections[ap.phase] ?? new Set<number>()
                const msg = adminMsgs[ap.phase]

                return (
                  <div key={ap.phase}>
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      {ap.label} <span className="text-xs text-gray-400">({ap.count} equipos)</span>
                    </p>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {pool.map((team) => {
                        const checked = selected.has(team.id)
                        return (
                          <label key={team.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-amber-100">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAdminTeam(ap.phase, team.id, ap.count)}
                              className="h-4 w-4 rounded border-gray-300 text-amber-600"
                            />
                            <TeamFlag teamName={team.name} size="sm" />
                            <span className={checked ? 'font-medium text-gray-900' : 'text-gray-600'}>{team.name}</span>
                          </label>
                        )
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSavePhaseResults(ap.phase)}
                        disabled={isPending}
                      >
                        Guardar ({selected.size}/{ap.count})
                      </Button>
                      {msg && (
                        <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Phase prediction cards */}
      {PHASES.map((cfg) => {
        const status = getStatus(cfg)
        const bonusPts = rules[cfg.bonusPtsKey] as number
        const availableTeams = getAvailableTeams(cfg.prevPhase)
        const phaseResults = phaseResultsMap.get(cfg.phase)
        const myPred = myPredMap.get(cfg.phase)
        const selected = selections[cfg.phase] ?? new Set<number>()
        const saveMsg = saveMsgs[cfg.phase]

        const statusBadge = {
          pending: <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">Pendiente</span>,
          open: <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Abierto</span>,
          closed: <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Cerrado</span>,
        }[status]

        return (
          <div key={cfg.phase} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{cfg.label}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  +{bonusPts} pts
                </span>
                {status === 'closed' && <Lock className="h-3.5 w-3.5 text-gray-400" />}
              </div>
              {statusBadge}
            </div>

            {/* Card body */}
            <div className="p-4">
              {status === 'pending' && (
                <p className="text-sm text-gray-400">
                  Pendiente: el admin aún no ha ingresado los clasificados de la fase anterior.
                </p>
              )}

              {status === 'open' && (
                <div>
                  {!paid ? (
                    <p className="text-sm text-gray-400">
                      Debes tener el pago confirmado para hacer predicciones.
                    </p>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Elige {cfg.picks} equipo{cfg.picks !== 1 ? 's' : ''} que crees que avanzarán
                        </p>
                        <span className={`text-xs font-semibold ${selected.size === cfg.picks ? 'text-green-600' : 'text-gray-500'}`}>
                          {selected.size} / {cfg.picks} {saving.has(cfg.phase) ? '· guardando...' : ''}
                        </span>
                      </div>
                      {saveMsg && (
                        <p className={`mb-2 text-xs ${saveMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{saveMsg.text}</p>
                      )}
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {availableTeams.map((team) => {
                          const checked = selected.has(team.id)
                          const disabled = !checked && selected.size >= cfg.picks
                          return (
                            <label
                              key={team.id}
                              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${checked ? 'bg-blue-50' : disabled ? 'opacity-40' : 'hover:bg-gray-50'}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => handleToggleTeam(cfg.phase, team.id, cfg.picks)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                              />
                              <TeamFlag teamName={team.name} size="sm" />
                              <span className={`${checked ? 'font-medium text-blue-900' : 'text-gray-700'}`}>{team.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {status === 'closed' && (
                <div>
                  {!myPred || myPred.team_ids.length === 0 ? (
                    <p className="text-sm text-gray-400">No realizaste predicciones para esta fase.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {(myPred.team_ids ?? []).map(Number).map((teamId) => {
                        const team = teamsById.get(teamId)
                        if (!team) return null
                        const hasResult = phaseResults && phaseResults.size > 0
                        const correct = hasResult ? phaseResults!.has(teamId) : null
                        return (
                          <div
                            key={teamId}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${correct === true ? 'bg-green-50' : correct === false ? 'bg-red-50' : 'bg-gray-50'}`}
                          >
                            {correct === true && <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />}
                            {correct === false && <X className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                            {correct === null && <span className="h-3.5 w-3.5 shrink-0" />}
                            <TeamFlag teamName={team.name} size="sm" />
                            <span className={`${correct === true ? 'font-medium text-green-900' : correct === false ? 'text-red-700' : 'text-gray-600'}`}>
                              {team.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {phaseResults && phaseResults.size > 0 && myPred && myPred.team_ids.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      {(myPred.team_ids ?? []).map(Number).every((id) => phaseResults!.has(id))
                        ? `✓ ¡Acertaste todos! +${bonusPts} pts`
                        : `✗ No acertaste todos — 0 pts de bono`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
