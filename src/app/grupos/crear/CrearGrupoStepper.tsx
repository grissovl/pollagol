'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2, Trophy, Swords, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createGroup, type GroupRulesInput } from '@/app/actions/groups'

export type MatchWithTeams = {
  id: number
  group_name: string | null
  scheduled_at: string
  home_team: { name: string; flag_emoji: string | null } | null
  away_team: { name: string; flag_emoji: string | null } | null
}

const DEFAULT_RULES: GroupRulesInput = {
  pts_exact: 5,
  pts_winner: 3,
  pts_goal: 1,
  pts_unique: 5,
  pts_r32_bonus: 10,
  pts_r16_bonus: 8,
  pts_r8_bonus: 4,
  pts_r4_bonus: 2,
  pts_final_bonus: 5,
  bet_amount: 0,
  prize_pct_1st: 70,
  prize_pct_2nd: 20,
  prize_pct_3rd: 10,
}

function formatMatchDate(scheduledAt: string): string {
  const d = new Date(scheduledAt)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const weekday = cap(
    d.toLocaleDateString('es', { weekday: 'short', timeZone: 'America/Santiago' }).replace('.', '')
  )
  const day = d.toLocaleDateString('es', { day: 'numeric', timeZone: 'America/Santiago' })
  const month = cap(
    d.toLocaleDateString('es', { month: 'short', timeZone: 'America/Santiago' }).replace('.', '')
  )
  const time = d.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  })
  return `${weekday} ${day} ${month} ${time}`
}

// ── Step indicator ────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Info básica', 'Reglas', 'Partidos']
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done
                    ? 'bg-blue-600 text-white'
                    : active
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  active ? 'text-blue-700' : done ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mb-5 h-0.5 w-12 sm:w-20 transition-colors ${
                  done ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Shared number input ───────────────────────────────────────

function RuleInput({
  label,
  value,
  onChange,
  suffix,
  min = 0,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  min?: number
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="flex-1 text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || 0))}
          className="w-20 text-center"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function CrearGrupoStepper({
  matches,
  fetchError,
}: {
  matches: MatchWithTeams[]
  fetchError?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)

  // Step 1
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [step1Error, setStep1Error] = useState('')

  // Step 2
  const [rules, setRules] = useState<GroupRulesInput>(DEFAULT_RULES)
  const [step2Error, setStep2Error] = useState('')

  // Step 3
  const allMatchIds = matches.map((m) => m.id)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(allMatchIds))
  const [submitError, setSubmitError] = useState('')

  // Group matches by group letter
  const matchesByGroup = matches.reduce<Record<string, MatchWithTeams[]>>((acc, m) => {
    const key = m.group_name ?? 'Otros'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})
  const sortedGroupLetters = Object.keys(matchesByGroup).sort()

  const updateRule = (key: keyof GroupRulesInput, value: number) =>
    setRules((prev) => ({ ...prev, [key]: value }))

  const prizeSum = rules.prize_pct_1st + rules.prize_pct_2nd + rules.prize_pct_3rd
  const prizeValid = prizeSum === 100

  // Group-level toggle
  const toggleGroup = (letter: string) => {
    const groupIds = matchesByGroup[letter].map((m) => m.id)
    const allSelected = groupIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      groupIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const toggleMatch = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStep1 = () => {
    if (!name.trim()) {
      setStep1Error('El nombre del grupo es requerido')
      return
    }
    setStep1Error('')
    setStep(2)
  }

  const handleStep2 = () => {
    if (!prizeValid) {
      setStep2Error(`Los porcentajes de premio deben sumar 100% (actualmente: ${prizeSum}%)`)
      return
    }
    setStep2Error('')
    setStep(3)
  }

  const handleSubmit = () => {
    setSubmitError('')
    startTransition(async () => {
      const result = await createGroup(name.trim(), description.trim(), rules, Array.from(selectedIds))
      if (result.error) {
        setSubmitError(result.error)
      } else if (result.groupId) {
        router.push(`/grupos/${result.groupId}`)
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Crear grupo</h1>
        <p className="mt-1 text-gray-500">Configura tu polla del Mundial 2026</p>
      </div>

      <StepIndicator current={step} />

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* ── STEP 1: Info básica ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nombre del grupo <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Los Cracks del Trabajo"
                maxLength={60}
                onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
              />
              {step1Error && <p className="mt-1.5 text-sm text-red-600">{step1Error}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Descripción <span className="text-gray-400">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agrega una descripción para tu grupo..."
                maxLength={200}
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{description.length}/200</p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Reglas y premios ── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Puntos */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Swords className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Puntos por predicción</h3>
              </div>
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <RuleInput
                  label="Marcador exacto acertado"
                  value={rules.pts_exact}
                  onChange={(v) => updateRule('pts_exact', v)}
                  suffix="pts"
                />
                <RuleInput
                  label="Ganador acertado"
                  value={rules.pts_winner}
                  onChange={(v) => updateRule('pts_winner', v)}
                  suffix="pts"
                />
                <RuleInput
                  label="Gol acertado"
                  value={rules.pts_goal}
                  onChange={(v) => updateRule('pts_goal', v)}
                  suffix="pts"
                />
                <RuleInput
                  label="Predicción única en el grupo"
                  value={rules.pts_unique}
                  onChange={(v) => updateRule('pts_unique', v)}
                  suffix="pts"
                />
              </div>
            </div>

            {/* Bonos eliminatorias */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-gray-800">Bonos fase eliminatoria</h3>
              </div>
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <RuleInput
                  label="Bono 16avos de final"
                  value={rules.pts_r32_bonus}
                  onChange={(v) => updateRule('pts_r32_bonus', v)}
                  suffix="pts"
                />
                <RuleInput
                  label="Bono octavos de final"
                  value={rules.pts_r16_bonus}
                  onChange={(v) => updateRule('pts_r16_bonus', v)}
                  suffix="pts"
                />
                <RuleInput
                  label="Bono cuartos de final"
                  value={rules.pts_r8_bonus}
                  onChange={(v) => updateRule('pts_r8_bonus', v)}
                  suffix="pts"
                />
                <RuleInput
                  label="Bono semifinales"
                  value={rules.pts_r4_bonus}
                  onChange={(v) => updateRule('pts_r4_bonus', v)}
                  suffix="pts"
                />
                <RuleInput
                  label="Bono final"
                  value={rules.pts_final_bonus}
                  onChange={(v) => updateRule('pts_final_bonus', v)}
                  suffix="pts"
                />
              </div>
            </div>

            {/* Apuesta y premios */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-base">💰</span>
                <h3 className="font-semibold text-gray-800">Apuesta y premios</h3>
              </div>
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <RuleInput
                  label="Valor de apuesta (CLP)"
                  value={rules.bet_amount}
                  onChange={(v) => updateRule('bet_amount', v)}
                  suffix="CLP"
                />
                <div className="border-t border-gray-200 pt-3">
                  <RuleInput
                    label="Premio 1er lugar"
                    value={rules.prize_pct_1st}
                    onChange={(v) => updateRule('prize_pct_1st', v)}
                    suffix="%"
                    min={0}
                  />
                  <div className="mt-3">
                    <RuleInput
                      label="Premio 2do lugar"
                      value={rules.prize_pct_2nd}
                      onChange={(v) => updateRule('prize_pct_2nd', v)}
                      suffix="%"
                      min={0}
                    />
                  </div>
                  <div className="mt-3">
                    <RuleInput
                      label="Premio 3er lugar"
                      value={rules.prize_pct_3rd}
                      onChange={(v) => updateRule('prize_pct_3rd', v)}
                      suffix="%"
                      min={0}
                    />
                  </div>
                  <div
                    className={`mt-3 flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                      prizeValid
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <span>Total</span>
                    <span>{prizeSum}% {prizeValid ? '✓' : `≠ 100%`}</span>
                  </div>
                </div>
              </div>
            </div>
            {step2Error && <p className="text-sm text-red-600">{step2Error}</p>}
          </div>
        )}

        {/* ── STEP 3: Partidos ── */}
        {step === 3 && (
          <div>
            {/* Debug banner — shows fetch errors if data didn't load */}
            {fetchError && (
              <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-800">
                <strong>Error al cargar partidos:</strong> {fetchError}
                <br />
                Verifica que el seed.sql se haya ejecutado en Supabase.
              </div>
            )}

            {allMatchIds.length === 0 && !fetchError && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                No se encontraron partidos. Asegúrate de haber ejecutado el seed.sql en Supabase.
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{selectedIds.size}</span>
                {' '}de {allMatchIds.length} partidos seleccionados
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set(allMatchIds))}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:underline"
                >
                  <Square className="h-3.5 w-3.5" />
                  Ninguno
                </button>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {sortedGroupLetters.map((letter) => {
                const groupMatches = matchesByGroup[letter]
                const groupIds = groupMatches.map((m) => m.id)
                const allGroupSelected = groupIds.every((id) => selectedIds.has(id))
                const someGroupSelected = groupIds.some((id) => selectedIds.has(id))
                const selectedCount = groupIds.filter((id) => selectedIds.has(id)).length

                return (
                  <div key={letter} className="overflow-hidden rounded-lg border border-gray-200">
                    {/* Group header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(letter)}
                      className="flex w-full items-center justify-between bg-gray-50 px-4 py-2.5 text-left hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-4 w-4 rounded border-2 flex items-center justify-center text-white text-xs ${
                            allGroupSelected
                              ? 'border-blue-600 bg-blue-600'
                              : someGroupSelected
                                ? 'border-blue-400 bg-blue-100'
                                : 'border-gray-300 bg-white'
                          }`}
                        >
                          {allGroupSelected ? '✓' : someGroupSelected ? '−' : ''}
                        </div>
                        <span className="font-semibold text-gray-800">Grupo {letter}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {selectedCount}/{groupMatches.length}
                      </span>
                    </button>

                    {/* Matches */}
                    <ul className="divide-y divide-gray-100">
                      {groupMatches.map((match) => {
                        const checked = selectedIds.has(match.id)
                        const homeFlag = match.home_team?.flag_emoji ?? ''
                        const homeName = match.home_team?.name ?? 'TBD'
                        const awayFlag = match.away_team?.flag_emoji ?? ''
                        const awayName = match.away_team?.name ?? 'TBD'

                        return (
                          <li key={match.id}>
                            <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleMatch(match.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="flex-1 text-sm text-gray-700">
                                {homeFlag} {homeName}{' '}
                                <span className="text-gray-400">vs</span>{' '}
                                {awayFlag} {awayName}
                              </span>
                              <span className="shrink-0 text-xs text-gray-400">
                                {formatMatchDate(match.scheduled_at)}
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>

            {submitError && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {submitError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isPending}>
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </Button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <Button onClick={step === 1 ? handleStep1 : handleStep2}>
            Continuar
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Grupo'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
