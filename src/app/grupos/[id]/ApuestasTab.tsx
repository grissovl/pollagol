'use client'

import { useState, useRef } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { upsertSpecialBet } from '@/app/actions/grupo-detail'
import { WC2026_TEAMS } from './constants'
import type { SpecialBet, MemberWithProfile, RulesData } from './types'

const LOCK_DATE = new Date('2026-06-11T18:45:00Z')

const CATEGORIES = [
  { id: 'champion' as const, label: 'Campeón del Mundo', pts: 20, icon: '🏆', type: 'select' as const },
  { id: 'golden_ball' as const, label: 'Balón de Oro', pts: 15, icon: '⚽', type: 'text' as const },
  { id: 'golden_boot' as const, label: 'Bota de Oro', pts: 15, icon: '👟', type: 'text' as const },
  { id: 'golden_glove' as const, label: 'Guante de Oro', pts: 10, icon: '🧤', type: 'text' as const },
]

interface Props {
  groupId: string
  userId: string
  isOwner: boolean
  ownerPlays: boolean
  paid: boolean
  myBets: SpecialBet[]
  allBets: SpecialBet[]
  members: MemberWithProfile[]
  rules: RulesData
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function ApuestasTab({
  groupId, userId, isOwner, ownerPlays, paid, myBets, allBets, members, rules,
}: Props) {
  const isLocked = new Date() >= LOCK_DATE

  const initValues = () => {
    const v: Record<string, string> = {}
    for (const cat of CATEGORIES) {
      const bet = myBets.find((b) => b.category === cat.id)
      v[cat.id] = bet?.team_or_player ?? ''
    }
    return v
  }

  const [values, setValues] = useState<Record<string, string>>(initValues)
  const [status, setStatus] = useState<Record<string, SaveStatus>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleChange = (catId: string, value: string) => {
    setValues((prev) => ({ ...prev, [catId]: value }))
    if (!paid || isLocked) return

    clearTimeout(timers.current[catId])
    timers.current[catId] = setTimeout(async () => {
      setStatus((prev) => ({ ...prev, [catId]: 'saving' }))
      const res = await upsertSpecialBet(groupId, catId, value.trim())
      setStatus((prev) => ({ ...prev, [catId]: res.error ? 'error' : 'saved' }))
      if (!res.error) {
        setTimeout(() => setStatus((prev) => ({ ...prev, [catId]: 'idle' })), 2000)
      }
    }, 900)
  }

  const results: Record<string, string | null | undefined> = {
    champion: rules.special_champion,
    golden_ball: rules.special_golden_ball,
    golden_boot: rules.special_golden_boot,
    golden_glove: rules.special_golden_glove,
  }

  const hasAnyResult = Object.values(results).some(Boolean)

  const betsByUser: Record<string, Record<string, string>> = {}
  for (const bet of allBets) {
    if (!betsByUser[bet.user_id]) betsByUser[bet.user_id] = {}
    betsByUser[bet.user_id][bet.category] = bet.team_or_player
  }

  const acceptedMembers = members.filter((m) => m.status === 'accepted')

  return (
    <div className="space-y-6">
      {/* Payment pending banner */}
      {!paid && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>
            <strong>Tu pago está pendiente.</strong> Solo puedes ver las predicciones cuando el admin confirme tu pago.
          </span>
        </div>
      )}
      {/* Lock status banner */}
      <div
        className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
          isLocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}
      >
        {isLocked ? (
          <>
            <Lock className="h-4 w-4 shrink-0" />
            <span>Apuestas bloqueadas · el torneo ya comenzó</span>
          </>
        ) : (
          <>
            <span className="text-base leading-none">✓</span>
            <span>
              Abierto hasta el <strong>11 Jun 14:45 GMT-4</strong>
            </span>
          </>
        )}
      </div>

      {/* Info note for player names */}
      <p className="flex gap-1.5 text-xs text-gray-400">
        <span className="mt-px shrink-0">ℹ️</span>
        <span>
          Para premios individuales (Balón de Oro, Bota de Oro y Guante de Oro), escribe el nombre
          del jugador exactamente como aparece en la{' '}
          <a
            href="https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            página oficial de la FIFA
          </a>
          .
        </span>
      </p>

      {/* 4 bet cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const s = status[cat.id] ?? 'idle'
          const result = results[cat.id]
          const userValue = values[cat.id]
          const isCorrect =
            !!result &&
            !!userValue &&
            userValue.trim().toLowerCase() === result.trim().toLowerCase()

          return (
            <div
              key={cat.id}
              className={`rounded-xl border p-4 shadow-sm transition-colors ${
                isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{cat.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{cat.label}</p>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {cat.pts} pts
                    </span>
                  </div>
                </div>
                {isLocked && result && (
                  <span
                    className={`text-xs font-semibold ${
                      isCorrect ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {isCorrect ? `✓ +${cat.pts} pts` : '✗'}
                  </span>
                )}
              </div>

              {cat.type === 'select' ? (
                <select
                  value={userValue}
                  onChange={(e) => handleChange(cat.id, e.target.value)}
                  disabled={!paid || isLocked}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar equipo...</option>
                  {WC2026_TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={userValue}
                  onChange={(e) => handleChange(cat.id, e.target.value)}
                  disabled={!paid || isLocked}
                  placeholder="Nombre del jugador"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}

              {isLocked && result && (
                <p className="mt-2 text-xs text-gray-500">
                  Ganador real:{' '}
                  <span className="font-semibold text-gray-700">{result}</span>
                </p>
              )}

              <div className="mt-2 h-4">
                {!isLocked && s === 'saving' && (
                  <span className="flex items-center gap-1 text-xs text-blue-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Guardando...
                  </span>
                )}
                {!isLocked && s === 'saved' && (
                  <span className="text-xs text-green-600">✓ Guardado</span>
                )}
                {!isLocked && s === 'error' && (
                  <span className="text-xs text-red-500">Error al guardar</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Admin: summary table of all participants */}
      {isOwner && (() => {
        const tableMembers = acceptedMembers.filter(
          (m) => ownerPlays || m.user_id !== userId,
        )
        return tableMembers.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Apuestas de todos los participantes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2.5 text-left">Jugador</th>
                    {CATEGORIES.map((cat) => (
                      <th key={cat.id} className="px-3 py-2.5 text-center">
                        <span className="text-base">{cat.icon}</span>
                        <span className="ml-1 hidden sm:inline">{cat.pts}pts</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Fila de resultado real */}
                  <tr className="bg-green-50">
                    <td className="px-3 py-2.5 font-semibold text-green-700">
                      ✓ Resultado real
                    </td>
                    {CATEGORIES.map((cat) => {
                      const result = results[cat.id]
                      return (
                        <td
                          key={cat.id}
                          className="px-3 py-2.5 text-center text-xs font-semibold text-green-700"
                        >
                          {result ?? <span className="font-normal text-gray-300">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                  {/* Filas de participantes */}
                  {tableMembers.map((member) => {
                    const bets = betsByUser[member.user_id] ?? {}
                    const isMe = member.user_id === userId
                    return (
                      <tr key={member.id} className={isMe ? 'bg-blue-50' : ''}>
                        <td className="px-3 py-2.5 font-medium text-gray-900">
                          {member.profile.name}
                          {isMe && (
                            <span className="ml-1 text-xs text-blue-600">(tú)</span>
                          )}
                        </td>
                        {CATEGORIES.map((cat) => {
                          const val = bets[cat.id]
                          const result = results[cat.id]
                          const correct =
                            !!result &&
                            !!val &&
                            val.trim().toLowerCase() === result.trim().toLowerCase()
                          return (
                            <td
                              key={cat.id}
                              className={`px-3 py-2.5 text-center text-xs ${
                                correct ? 'font-semibold text-green-700' : 'text-gray-600'
                              }`}
                            >
                              {val ?? <span className="text-gray-300">—</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {hasAnyResult && (
              <p className="mt-2 text-xs text-gray-400">Verde = apuesta correcta</p>
            )}
          </div>
        )
      })()}
    </div>
  )
}
