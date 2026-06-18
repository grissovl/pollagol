'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clipboard, Check, Users, DollarSign, CheckCircle2, Clock,
  Trash2, UserX, Swords, Trophy, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  updateGroupRules, updateGroupPrizes, deleteGroup,
  acceptMembership, rejectMembership, removeMember,
  toggleMemberPayment, setGroupMatches, saveMatchResult,
  updateOwnerPlays,
} from '@/app/actions/grupo-detail'
import { calcularPuntajes } from '@/app/actions/scoring'
import JugarTab from './JugarTab'
import ApuestasTab from './ApuestasTab'
import PuntuacionTab from './PuntuacionTab'
import ClasificadosTab from './ClasificadosTab'
import TeamFlag from '@/components/ui/TeamFlag'
import { WC2026_TEAMS } from './constants'
import { saveSpecialResults } from '@/app/actions/grupo-detail'
export type {
  GrupoData, RulesData, MyMembership, MemberWithProfile,
  MatchData, PredictionData, LeaderboardEntry, SpecialBet,
  PhasePrediction, PhaseResult, TeamBasic, AllPredictionData,
} from './types'
import type {
  GrupoData, RulesData, MyMembership, MemberWithProfile,
  MatchData, PredictionData, LeaderboardEntry, SpecialBet,
  PhasePrediction, PhaseResult, TeamBasic, AllPredictionData,
} from './types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  group: GrupoData
  rules: RulesData
  myMembership: MyMembership | null
  isOwner: boolean
  userId: string
  members: MemberWithProfile[]
  allMatches: MatchData[]
  groupMatches: MatchData[]
  myPredictions: PredictionData[]
  leaderboard: LeaderboardEntry[]
  mySpecialBets: SpecialBet[]
  allSpecialBets: SpecialBet[]
  myPhasePredictions: PhasePrediction[]
  allPhaseResults: PhaseResult[]
  allTeams: TeamBasic[]
  allGroupPredictions: AllPredictionData[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const time = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Santiago' })
  return `${weekday} ${day} ${month} ${time}`
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

function AvatarInitial({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function RuleInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="flex-1 text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-20 text-center"
        />
        {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
      </div>
    </div>
  )
}

// ── WhatsAppIcon ──────────────────────────────────────────────────────────────

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ── ShareButtons ──────────────────────────────────────────────────────────────

function ShareButtons({ groupName, code }: { groupName: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const message = `¡Únete a mi polla del Mundial 2026! 🏆⚽\nGrupo: ${groupName}\nCódigo: ${code}\nRegístrate en: https://pollagol-omega.vercel.app`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
      >
        {copied
          ? <Check className="h-4 w-4 text-green-600" />
          : <Clipboard className="h-4 w-4 text-gray-400" />}
        {copied ? '¡Copiado!' : 'Copiar invitación'}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
      >
        <WhatsAppIcon />
        Compartir por WhatsApp
      </a>
    </div>
  )
}

// ── RulesTable ────────────────────────────────────────────────────────────────

function RulesTable({ rules }: { rules: RulesData }) {
  const rows = [
    { label: 'Marcador exacto', value: `${rules.pts_exact} pts`, section: 'pts' },
    { label: 'Ganador acertado', value: `${rules.pts_winner} pts`, section: 'pts' },
    { label: 'Gol acertado', value: `${rules.pts_goal} pts`, section: 'pts' },
    { label: 'Predicción única', value: `${rules.pts_unique} pts`, section: 'pts' },
    { label: 'Bono 16avos', value: `${rules.pts_r32_bonus} pts`, section: 'bonus' },
    { label: 'Bono octavos', value: `${rules.pts_r16_bonus} pts`, section: 'bonus' },
    { label: 'Bono cuartos', value: `${rules.pts_r8_bonus} pts`, section: 'bonus' },
    { label: 'Bono semis', value: `${rules.pts_r4_bonus} pts`, section: 'bonus' },
    { label: 'Bono final', value: `${rules.pts_final_bonus} pts`, section: 'bonus' },
  ]
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className={row.section === 'bonus' ? 'bg-amber-50/50' : ''}>
              <td className="px-4 py-2.5 text-gray-600">{row.label}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-3 divide-x divide-gray-200 border-t border-gray-200 bg-blue-50">
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs text-gray-500">1er lugar</p>
          <p className="font-semibold text-blue-700">{rules.prize_pct_1st}%</p>
        </div>
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs text-gray-500">2do lugar</p>
          <p className="font-semibold text-blue-700">{rules.prize_pct_2nd}%</p>
        </div>
        <div className="px-4 py-2.5 text-center">
          <p className="text-xs text-gray-500">3er lugar</p>
          <p className="font-semibold text-blue-700">{rules.prize_pct_3rd}%</p>
        </div>
      </div>
    </div>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'pending' | 'accepted' | 'rejected' }> = {
    pending: { label: 'Pendiente', variant: 'pending' },
    accepted: { label: 'Aceptado', variant: 'accepted' },
    rejected: { label: 'Rechazado', variant: 'rejected' },
  }
  const s = map[status] ?? { label: status, variant: 'pending' as const }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

// ── PaymentToggle ─────────────────────────────────────────────────────────────

function PaymentToggle({ paid, onToggle, disabled }: { paid: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${paid ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${paid ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

// ── ADMIN TABS ────────────────────────────────────────────────────────────────

function AdminInfoTab({
  group, rules, members, myMembership,
}: {
  group: GrupoData
  rules: RulesData
  members: MemberWithProfile[]
  myMembership: MyMembership | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [calcMsg, setCalcMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const accepted = members.filter((m) => m.status === 'accepted')
  const paid = members.filter((m) => m.status === 'accepted' && m.paid)
  const pending = members.filter((m) => m.status === 'pending')
  const paidPlaying = paid.filter((m) => group.owner_plays || m.user_id !== group.owner_id)
  const acumulado = paidPlaying.length * rules.bet_amount

  const handleRecalcular = () => {
    setCalcMsg(null)
    startTransition(async () => {
      const res = await calcularPuntajes(group.id)
      if (res.error) {
        setCalcMsg({ text: res.error })
      } else {
        setCalcMsg({ ok: true, text: `Puntajes recalculados (${res.updated ?? 0} predicciones)` })
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
        <ShareButtons groupName={group.name} code={group.code} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">Acumulado</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-gray-900">
            ${acumulado.toLocaleString('es-CL')}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Aceptados</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-green-700">{accepted.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Pagados</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-blue-700">{paid.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pendientes</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-yellow-600">{pending.length}</p>
        </div>
      </div>

      {/* Rules */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Reglas y premios</h3>
        <RulesTable rules={rules} />
      </div>

      {/* Recalculate scores */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-700">Puntajes</p>
        <p className="mt-1 text-xs text-gray-500">
          Ejecuta manualmente después de ingresar resultados de partidos.
        </p>
        {calcMsg && (
          <p className={`mt-2 text-sm ${calcMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
            {calcMsg.text}
          </p>
        )}
        <Button onClick={handleRecalcular} disabled={isPending} variant="outline" className="mt-3">
          {isPending ? 'Calculando...' : 'Recalcular puntos'}
        </Button>
      </div>

      {/* My subscription */}
      {myMembership && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-700">Mi suscripción</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>N° {myMembership.subscription_number}</span>
            <StatusBadge status={myMembership.status} />
            <Badge variant={myMembership.paid ? 'accepted' : 'destructive'}>
              {myMembership.paid ? 'Pagado' : 'Sin pagar'}
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ConfigTab ─────────────────────────────────────────────────────────────────

function ConfigTab({
  group, rules,
}: {
  group: GrupoData
  rules: RulesData
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [pts, setPts] = useState({
    pts_exact: rules.pts_exact,
    pts_winner: rules.pts_winner,
    pts_goal: rules.pts_goal,
    pts_unique: rules.pts_unique,
    pts_r32_bonus: rules.pts_r32_bonus,
    pts_r16_bonus: rules.pts_r16_bonus,
    pts_r8_bonus: rules.pts_r8_bonus,
    pts_r4_bonus: rules.pts_r4_bonus,
    pts_final_bonus: rules.pts_final_bonus,
  })
  const [ptsMsg, setPtsMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const [prizes, setPrizes] = useState({
    bet_amount: rules.bet_amount,
    prize_pct_1st: rules.prize_pct_1st,
    prize_pct_2nd: rules.prize_pct_2nd,
    prize_pct_3rd: rules.prize_pct_3rd,
  })
  const [prizesMsg, setPrizesMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const [ownerPlays, setOwnerPlays] = useState(group.owner_plays)
  const [ownerPlaysMsg, setOwnerPlaysMsg] = useState<string | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const prizeSum = prizes.prize_pct_1st + prizes.prize_pct_2nd + prizes.prize_pct_3rd

  const handleUpdateRules = () => {
    setPtsMsg(null)
    startTransition(async () => {
      const res = await updateGroupRules(group.id, pts)
      if (res.error) {
        setPtsMsg({ text: res.error })
      } else {
        setPtsMsg({ ok: true, text: 'Reglas actualizadas' })
        router.refresh()
      }
    })
  }

  const handleUpdatePrizes = () => {
    if (prizeSum !== 100) {
      setPrizesMsg({ text: `Los porcentajes deben sumar 100% (ahora: ${prizeSum}%)` })
      return
    }
    setPrizesMsg(null)
    startTransition(async () => {
      const res = await updateGroupPrizes(group.id, prizes.bet_amount, prizes.prize_pct_1st, prizes.prize_pct_2nd, prizes.prize_pct_3rd)
      if (res.error) {
        setPrizesMsg({ text: res.error })
      } else {
        setPrizesMsg({ ok: true, text: 'Premios actualizados' })
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    setDeleteError('')
    startTransition(async () => {
      const res = await deleteGroup(group.id)
      if (res.error) {
        setDeleteError(res.error)
      } else {
        router.push('/')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Points rules */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Swords className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Puntos por predicción</h3>
        </div>
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <RuleInput label="Marcador exacto" value={pts.pts_exact} onChange={(v) => setPts((p) => ({ ...p, pts_exact: v }))} suffix="pts" />
          <RuleInput label="Ganador acertado" value={pts.pts_winner} onChange={(v) => setPts((p) => ({ ...p, pts_winner: v }))} suffix="pts" />
          <RuleInput label="Gol acertado" value={pts.pts_goal} onChange={(v) => setPts((p) => ({ ...p, pts_goal: v }))} suffix="pts" />
          <RuleInput label="Predicción única" value={pts.pts_unique} onChange={(v) => setPts((p) => ({ ...p, pts_unique: v }))} suffix="pts" />
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-gray-200 bg-amber-50/50">
          <div className="mt-4 flex-1 space-y-3 rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Bonos eliminatorias</span>
            </div>
            <RuleInput label="Bono 16avos" value={pts.pts_r32_bonus} onChange={(v) => setPts((p) => ({ ...p, pts_r32_bonus: v }))} suffix="pts" />
            <RuleInput label="Bono octavos" value={pts.pts_r16_bonus} onChange={(v) => setPts((p) => ({ ...p, pts_r16_bonus: v }))} suffix="pts" />
            <RuleInput label="Bono cuartos" value={pts.pts_r8_bonus} onChange={(v) => setPts((p) => ({ ...p, pts_r8_bonus: v }))} suffix="pts" />
            <RuleInput label="Bono semis" value={pts.pts_r4_bonus} onChange={(v) => setPts((p) => ({ ...p, pts_r4_bonus: v }))} suffix="pts" />
            <RuleInput label="Bono final" value={pts.pts_final_bonus} onChange={(v) => setPts((p) => ({ ...p, pts_final_bonus: v }))} suffix="pts" />
          </div>
        </div>
        {ptsMsg && (
          <p className={`mt-3 text-sm ${ptsMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{ptsMsg.text}</p>
        )}
        <Button onClick={handleUpdateRules} disabled={isPending} className="mt-4">
          Actualizar Reglas
        </Button>
      </section>

      {/* Prizes */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-base">💰</span>
          <h3 className="font-semibold text-gray-800">Apuesta y premios</h3>
        </div>
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <RuleInput label="Valor apuesta (CLP)" value={prizes.bet_amount} onChange={(v) => setPrizes((p) => ({ ...p, bet_amount: v }))} suffix="CLP" />
          <div className="border-t border-gray-200 pt-3">
            <RuleInput label="Premio 1er lugar" value={prizes.prize_pct_1st} onChange={(v) => setPrizes((p) => ({ ...p, prize_pct_1st: v }))} suffix="%" />
            <div className="mt-3">
              <RuleInput label="Premio 2do lugar" value={prizes.prize_pct_2nd} onChange={(v) => setPrizes((p) => ({ ...p, prize_pct_2nd: v }))} suffix="%" />
            </div>
            <div className="mt-3">
              <RuleInput label="Premio 3er lugar" value={prizes.prize_pct_3rd} onChange={(v) => setPrizes((p) => ({ ...p, prize_pct_3rd: v }))} suffix="%" />
            </div>
            <div className={`mt-3 flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${prizeSum === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <span>Total</span>
              <span>{prizeSum}% {prizeSum === 100 ? '✓' : '≠ 100%'}</span>
            </div>
          </div>
        </div>
        {prizesMsg && (
          <p className={`mt-3 text-sm ${prizesMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{prizesMsg.text}</p>
        )}
        <Button onClick={handleUpdatePrizes} disabled={isPending} className="mt-4">
          Actualizar Premios
        </Button>
      </section>

      {/* Owner plays toggle */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800">Participación del organizador</h3>
        <p className="mt-1 text-sm text-gray-500">
          Controla si el organizador participa como jugador en este grupo.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Participar como jugador</p>
            <p className="text-xs text-gray-400">
              {ownerPlays
                ? 'Tus predicciones cuentan en el ranking'
                : 'No apareces en el ranking ni en el tab Jugar'}
            </p>
          </div>
          <button
            onClick={() => {
              const next = !ownerPlays
              setOwnerPlays(next)
              setOwnerPlaysMsg(null)
              startTransition(async () => {
                const res = await updateOwnerPlays(group.id, next)
                if (res.error) {
                  setOwnerPlays(!next)
                  setOwnerPlaysMsg(res.error)
                } else {
                  router.refresh()
                }
              })
            }}
            disabled={isPending}
            className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${ownerPlays ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${ownerPlays ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
        {ownerPlaysMsg && <p className="mt-2 text-sm text-red-600">{ownerPlaysMsg}</p>}
      </section>

      {/* Delete group */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-800">Zona de peligro</h3>
        <p className="mt-1 text-sm text-red-700">Eliminar el grupo borra todos los datos permanentemente.</p>
        {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
        {!deleteConfirm ? (
          <Button
            variant="destructive"
            onClick={() => setDeleteConfirm(true)}
            className="mt-4"
          >
            <Trash2 className="h-4 w-4" />
            Borrar grupo
          </Button>
        ) : (
          <div className="mt-4 flex gap-3">
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Sí, eliminar definitivamente
            </Button>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

// ── ParticipantesTab ──────────────────────────────────────────────────────────

function ParticipantesTab({
  group, members,
}: {
  group: GrupoData
  members: MemberWithProfile[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localMembers, setLocalMembers] = useState(members)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const pending = localMembers.filter((m) => m.status === 'pending')
  const rest = localMembers.filter((m) => m.status !== 'pending')

  const handleAccept = (membershipId: string) => {
    startTransition(async () => {
      const res = await acceptMembership(membershipId, group.id)
      if (!res.error) {
        setLocalMembers((prev) => prev.map((m) => m.id === membershipId ? { ...m, status: 'accepted' } : m))
        router.refresh()
      }
    })
  }

  const handleReject = (membershipId: string) => {
    startTransition(async () => {
      const res = await rejectMembership(membershipId, group.id)
      if (!res.error) {
        setLocalMembers((prev) => prev.map((m) => m.id === membershipId ? { ...m, status: 'rejected' } : m))
        router.refresh()
      }
    })
  }

  const handleRemove = (membershipId: string) => {
    startTransition(async () => {
      const res = await removeMember(membershipId, group.id)
      if (!res.error) {
        setLocalMembers((prev) => prev.filter((m) => m.id !== membershipId))
        setConfirmRemove(null)
        router.refresh()
      }
    })
  }

  const handleTogglePay = (membershipId: string, currentPaid: boolean) => {
    const newPaid = !currentPaid
    startTransition(async () => {
      const res = await toggleMemberPayment(membershipId, group.id, newPaid)
      if (!res.error) {
        setLocalMembers((prev) => prev.map((m) => m.id === membershipId ? { ...m, paid: newPaid } : m))
      }
    })
  }

  const MemberRow = ({ m }: { m: MemberWithProfile }) => (
    <div className="flex items-center gap-3 px-4 py-3">
      <AvatarInitial name={m.profile.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{m.profile.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <StatusBadge status={m.status} />
          {m.status === 'accepted' && (
            <span className={`text-xs font-medium ${m.paid ? 'text-green-600' : 'text-red-500'}`}>
              {m.paid ? '● Pagado' : '○ Sin pagar'}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {m.status === 'accepted' && (
          <PaymentToggle
            paid={m.paid}
            onToggle={() => handleTogglePay(m.id, m.paid)}
            disabled={isPending}
          />
        )}
        {m.status === 'pending' && (
          <>
            <Button size="sm" variant="outline" onClick={() => handleAccept(m.id)} disabled={isPending}>
              Aceptar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleReject(m.id)} disabled={isPending}>
              Rechazar
            </Button>
          </>
        )}
        {confirmRemove === m.id ? (
          <>
            <Button size="sm" variant="destructive" onClick={() => handleRemove(m.id)} disabled={isPending}>
              Confirmar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmRemove(null)}>
              No
            </Button>
          </>
        ) : (
          <button
            onClick={() => setConfirmRemove(m.id)}
            disabled={isPending}
            className="rounded p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            <UserX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-yellow-700">
            Solicitudes pendientes ({pending.length})
          </h3>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-yellow-200 bg-white">
            {pending.map((m) => <MemberRow key={m.id} m={m} />)}
          </div>
        </div>
      )}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Miembros ({rest.length})
        </h3>
        {rest.length === 0 ? (
          <p className="text-sm text-gray-400">No hay miembros aún.</p>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {rest.map((m) => <MemberRow key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── PartidosTab (admin) ───────────────────────────────────────────────────────

function PartidosTab({
  group, allMatches, rules,
}: {
  group: GrupoData
  allMatches: MatchData[]
  rules: RulesData
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(allMatches.filter((m) => m.in_group).map((m) => m.id)),
  )
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  // Special results state
  const [showSpecialRes, setShowSpecialRes] = useState(false)
  const [spChampion, setSpChampion] = useState(rules.special_champion ?? '')
  const [spGoldenBall, setSpGoldenBall] = useState(rules.special_golden_ball ?? '')
  const [spGoldenBoot, setSpGoldenBoot] = useState(rules.special_golden_boot ?? '')
  const [spGoldenGlove, setSpGoldenGlove] = useState(rules.special_golden_glove ?? '')
  const [specialMsg, setSpecialMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const handleSaveSpecial = () => {
    setSpecialMsg(null)
    startTransition(async () => {
      const res = await saveSpecialResults(
        group.id,
        spChampion || null,
        spGoldenBall || null,
        spGoldenBoot || null,
        spGoldenGlove || null,
      )
      if (res.error) {
        setSpecialMsg({ text: res.error })
      } else {
        setSpecialMsg({ ok: true, text: 'Resultados guardados · puntajes recalculados' })
        router.refresh()
      }
    })
  }

  // Result entry state — all past group matches (with or without result, always editable)
  const now = new Date()
  const pastGroupMatches = allMatches.filter(
    (m) => m.in_group && new Date(m.scheduled_at) < now,
  )
  const pendingMatches = pastGroupMatches.filter((m) => m.home_score == null || m.away_score == null)
  const completedMatches = pastGroupMatches.filter((m) => m.home_score != null && m.away_score != null)
  const [showResultados, setShowResultados] = useState(pastGroupMatches.length > 0)
  const [showCompletados, setShowCompletados] = useState(false)
  const [showPartidos, setShowPartidos] = useState(false)
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>(() => {
    const init: Record<number, { home: string; away: string }> = {}
    pastGroupMatches.forEach((m) => {
      init[m.id] = {
        home: m.home_score != null ? String(m.home_score) : '',
        away: m.away_score != null ? String(m.away_score) : '',
      }
    })
    return init
  })
  const [matchMsgs, setMatchMsgs] = useState<Record<number, { ok?: boolean; text: string } | undefined>>({})

  const matchesByPhase = allMatches.reduce<Record<string, MatchData[]>>((acc, m) => {
    const k = m.phase
    if (!acc[k]) acc[k] = []
    acc[k].push(m)
    return acc
  }, {})

  const sortedPhases = phaseOrder.filter((p) => matchesByPhase[p]?.length)

  const toggleMatch = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePhase = (phase: string) => {
    const ids = (matchesByPhase[phase] ?? []).map((m) => m.id)
    const allSelected = ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const handleSave = () => {
    setMsg(null)
    startTransition(async () => {
      const res = await setGroupMatches(group.id, Array.from(selectedIds))
      if (res.error) {
        setMsg({ text: res.error })
      } else {
        setMsg({ ok: true, text: 'Partidos actualizados' })
        router.refresh()
      }
    })
  }

  const handleSaveResult = (matchId: number) => {
    const s = scores[matchId]
    const home = parseInt(s?.home ?? '', 10)
    const away = parseInt(s?.away ?? '', 10)
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setMatchMsgs((prev) => ({ ...prev, [matchId]: { text: 'Ingresa ambos marcadores (números ≥ 0)' } }))
      return
    }
    setMatchMsgs((prev) => ({ ...prev, [matchId]: undefined }))
    startTransition(async () => {
      const res = await saveMatchResult(group.id, matchId, home, away)
      if (res.error) {
        setMatchMsgs((prev) => ({ ...prev, [matchId]: { text: res.error! } }))
      } else {
        setMatchMsgs((prev) => ({
          ...prev,
          [matchId]: { ok: true, text: 'Resultado guardado · puntajes recalculados' },
        }))
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ── Ingresar resultados ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowResultados((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          <span>
            Ingresar resultados
            {pendingMatches.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {pendingMatches.length} pendiente{pendingMatches.length > 1 ? 's' : ''}
              </span>
            )}
          </span>
          <span className="text-gray-400">{showResultados ? '▲' : '▼'}</span>
        </button>

        {showResultados && (
          <div className="mt-3 space-y-3">
            {pendingMatches.length === 0 && completedMatches.length === 0 ? (
              <p className="text-sm text-gray-400">No hay partidos pasados.</p>
            ) : pendingMatches.length === 0 ? (
              <p className="text-sm text-gray-400">Todos los partidos tienen resultado ingresado.</p>
            ) : (
              pendingMatches.map((match) => {
                const s = scores[match.id] ?? { home: '', away: '' }
                const mmsg = matchMsgs[match.id]
                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                          {match.home_team && <TeamFlag teamName={match.home_team.name} size="sm" />}
                          {match.home_team?.name ?? 'TBD'}
                          <span className="text-gray-400">vs</span>
                          {match.away_team?.name ?? 'TBD'}
                          {match.away_team && <TeamFlag teamName={match.away_team.name} size="sm" />}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{formatMatchDate(match.scheduled_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={s.home}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], home: e.target.value },
                            }))
                          }
                          className="w-16 text-center"
                        />
                        <span className="text-sm font-bold text-gray-400">-</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={s.away}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], away: e.target.value },
                            }))
                          }
                          className="w-16 text-center"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveResult(match.id)}
                          disabled={isPending}
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                    {mmsg && (
                      <p className={`mt-2 text-xs ${mmsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                        {mmsg.text}
                      </p>
                    )}
                  </div>
                )
              })
            )}
            {completedMatches.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowCompletados((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCompletados ? 'rotate-180' : ''}`} />
                  {showCompletados ? 'Ocultar' : 'Mostrar'} completados ({completedMatches.length})
                </button>
                {showCompletados && (
                  <div className="mt-2 space-y-3">
                    {completedMatches.map((match) => {
                      const s = scores[match.id] ?? { home: '', away: '' }
                      const mmsg = matchMsgs[match.id]
                      return (
                        <div
                          key={match.id}
                          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm opacity-80"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                {match.home_team && <TeamFlag teamName={match.home_team.name} size="sm" />}
                                {match.home_team?.name ?? 'TBD'}
                                <span className="text-gray-400">vs</span>
                                {match.away_team?.name ?? 'TBD'}
                                {match.away_team && <TeamFlag teamName={match.away_team.name} size="sm" />}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-400">{formatMatchDate(match.scheduled_at)}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={s.home}
                                onChange={(e) =>
                                  setScores((prev) => ({
                                    ...prev,
                                    [match.id]: { ...prev[match.id], home: e.target.value },
                                  }))
                                }
                                className="w-16 text-center"
                              />
                              <span className="text-sm font-bold text-gray-400">-</span>
                              <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={s.away}
                                onChange={(e) =>
                                  setScores((prev) => ({
                                    ...prev,
                                    [match.id]: { ...prev[match.id], away: e.target.value },
                                  }))
                                }
                                className="w-16 text-center"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveResult(match.id)}
                                disabled={isPending}
                              >
                                Guardar
                              </Button>
                            </div>
                          </div>
                          {mmsg && (
                            <p className={`mt-2 text-xs ${mmsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                              {mmsg.text}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Resultados especiales ── */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => setShowSpecialRes((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          <span>Resultados especiales</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${showSpecialRes ? 'rotate-180' : ''}`}
          />
        </button>

        {showSpecialRes && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-gray-600">🏆 Campeón</span>
              <select
                value={spChampion}
                onChange={(e) => setSpChampion(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sin resultado</option>
                {WC2026_TEAMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-gray-600">⚽ Balón de Oro</span>
              <input
                type="text"
                value={spGoldenBall}
                onChange={(e) => setSpGoldenBall(e.target.value)}
                placeholder="Nombre del jugador"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-gray-600">👟 Bota de Oro</span>
              <input
                type="text"
                value={spGoldenBoot}
                onChange={(e) => setSpGoldenBoot(e.target.value)}
                placeholder="Nombre del jugador"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-gray-600">🧤 Guante de Oro</span>
              <input
                type="text"
                value={spGoldenGlove}
                onChange={(e) => setSpGoldenGlove(e.target.value)}
                placeholder="Nombre del jugador"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {specialMsg && (
              <p className={`text-sm ${specialMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                {specialMsg.text}
              </p>
            )}
            <Button onClick={handleSaveSpecial} disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Guardando...' : 'Guardar resultados'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Partidos del grupo ── */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => setShowPartidos((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          <span>
            Partidos del grupo
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({selectedIds.size} de {allMatches.length} habilitados)
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${showPartidos ? 'rotate-180' : ''}`}
          />
        </button>

        {showPartidos && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-end gap-2">
              <button className="text-xs text-blue-600 hover:underline" onClick={() => setSelectedIds(new Set(allMatches.map((m) => m.id)))}>
                Seleccionar todos
              </button>
              <button className="text-xs text-gray-500 hover:underline" onClick={() => setSelectedIds(new Set())}>
                Ninguno
              </button>
            </div>

            <div className="space-y-3" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              {sortedPhases.map((phase) => {
                const ms = matchesByPhase[phase]
                const allSel = ms.every((m) => selectedIds.has(m.id))
                const someSel = ms.some((m) => selectedIds.has(m.id))
                return (
                  <div key={phase} className="overflow-hidden rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => togglePhase(phase)}
                      className="flex w-full items-center justify-between bg-gray-50 px-4 py-2.5 text-left hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-4 w-4 items-center justify-center rounded border-2 text-xs text-white ${allSel ? 'border-blue-600 bg-blue-600' : someSel ? 'border-blue-400 bg-blue-100' : 'border-gray-300 bg-white'}`}>
                          {allSel ? '✓' : someSel ? '−' : ''}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{phaseLabels[phase] ?? phase}</span>
                      </div>
                      <span className="text-xs text-gray-500">{ms.filter((m) => selectedIds.has(m.id)).length}/{ms.length}</span>
                    </button>
                    <ul className="divide-y divide-gray-100">
                      {ms.map((match) => (
                        <li key={match.id}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(match.id)}
                              onChange={() => toggleMatch(match.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="flex flex-1 items-center gap-1.5 text-sm text-gray-700">
                              {match.home_team && <TeamFlag teamName={match.home_team.name} size="sm" />}
                              {match.home_team?.name ?? 'TBD'}
                              <span className="text-gray-400">vs</span>
                              {match.away_team?.name ?? 'TBD'}
                              {match.away_team && <TeamFlag teamName={match.away_team.name} size="sm" />}
                              {match.group_name && <span className="text-xs text-gray-400">(Gr. {match.group_name})</span>}
                            </span>
                            <span className="shrink-0 text-xs text-gray-400">{formatMatchDate(match.scheduled_at)}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {msg && <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}

            <Button onClick={handleSave} disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── PARTICIPANT TABS ───────────────────────────────────────────────────────────

function ParticipantInfoTab({
  group, rules, myMembership, acumulado,
}: {
  group: GrupoData
  rules: RulesData
  myMembership: MyMembership | null
  acumulado: number
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
        <ShareButtons groupName={group.name} code={group.code} />
      </div>

      {rules.bet_amount > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">Acumulado</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-gray-900">
            ${acumulado.toLocaleString('es-CL')}
          </p>
        </div>
      )}

      {myMembership && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-700">Mi suscripción</p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <span className="text-gray-600">N° {myMembership.subscription_number}</span>
            <StatusBadge status={myMembership.status} />
            <Badge variant={myMembership.paid ? 'accepted' : 'destructive'}>
              {myMembership.paid ? 'Pagado' : 'Sin pagar'}
            </Badge>
            {!myMembership.paid && rules.bet_amount > 0 && (
              <span className="text-gray-500">
                Valor: <span className="font-semibold">${rules.bet_amount.toLocaleString('es-CL')}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Reglas del grupo</h3>
        <RulesTable rules={rules} />
      </div>
    </div>
  )
}

// ── PosicionesTab ─────────────────────────────────────────────────────────────

function PosicionesTab({ leaderboard, userId }: { leaderboard: LeaderboardEntry[]; userId: string }) {
  if (leaderboard.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
        <p className="text-gray-500">Aún no hay puntajes calculados.</p>
        <p className="mt-1 text-sm text-gray-400">Los puntos se calculan después de cada partido.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-0 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span className="w-7">#</span>
        <span>Jugador</span>
        <span className="w-8 text-center">ME</span>
        <span className="w-8 text-center">GA</span>
        <span className="w-8 text-center">GoA</span>
        <span className="w-8 text-center">Pu</span>
        <span className="w-10 text-center">Bon</span>
        <span className="w-12 text-right font-bold text-gray-700">Total</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {leaderboard.map((entry, i) => {
          const isMe = entry.user_id === userId
          return (
            <li
              key={entry.user_id}
              className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] items-center gap-0 px-4 py-3 ${isMe ? 'bg-blue-50' : ''}`}
            >
              <span className={`w-7 text-sm font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-500'}`}>
                {i + 1}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <AvatarInitial name={entry.name} />
                <span className={`truncate text-sm font-medium ${isMe ? 'text-blue-700' : 'text-gray-900'}`}>
                  {entry.name} {isMe && <span className="text-xs">(tú)</span>}
                </span>
              </div>
              <span className="w-8 text-center text-xs text-gray-600">{entry.pts_exact}</span>
              <span className="w-8 text-center text-xs text-gray-600">{entry.pts_winner}</span>
              <span className="w-8 text-center text-xs text-gray-600">{entry.pts_goal}</span>
              <span className="w-8 text-center text-xs text-gray-600">{entry.pts_unique}</span>
              <span className="w-10 text-center text-xs text-gray-600">{entry.pts_bonus}</span>
              <span className="w-12 text-right text-sm font-bold text-blue-700">{entry.total}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Historial cell style by points ───────────────────────────────────────────

function getPtsStyle(pts: number): { bg: string; text: string } {
  if (pts >= 10) return { bg: 'bg-yellow-400', text: 'text-yellow-900' }
  if (pts === 5)  return { bg: 'bg-green-500',  text: 'text-white' }
  if (pts === 4)  return { bg: 'bg-green-400',  text: 'text-green-900' }
  if (pts === 3)  return { bg: 'bg-green-300',  text: 'text-green-800' }
  if (pts === 2)  return { bg: 'bg-green-200',  text: 'text-green-700' }
  if (pts === 1)  return { bg: 'bg-green-100',  text: 'text-green-700' }
  return { bg: 'bg-gray-100', text: 'text-gray-500' }
}

// ── PronosticosTab ────────────────────────────────────────────────────────────

function PronosticosTab({
  groupMatches, members, allGroupPredictions, group, userId,
}: {
  groupMatches: MatchData[]
  members: MemberWithProfile[]
  allGroupPredictions: AllPredictionData[]
  group: GrupoData
  userId: string
}) {
  const now = new Date()
  const matches = groupMatches
    .filter((m) => new Date(m.scheduled_at) <= now && m.home_score == null)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  const playingMembers = members
    .filter((m) => m.status === 'accepted')
    .filter((m) => group.owner_plays || m.user_id !== group.owner_id)

  const predMap: Record<number, Record<string, AllPredictionData>> = {}
  for (const p of allGroupPredictions) {
    if (!predMap[p.match_id]) predMap[p.match_id] = {}
    predMap[p.match_id][p.user_id] = p
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
        <p className="text-gray-500">No hay partidos en curso con pronósticos disponibles.</p>
        <p className="mt-1 text-sm text-gray-400">Los pronósticos se revelan cuando el partido comienza.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        {matches.length} partido{matches.length > 1 ? 's' : ''} iniciado{matches.length > 1 ? 's' : ''} sin resultado
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Partido
              </th>
              {playingMembers.map((m) => (
                <th
                  key={m.user_id}
                  title={m.profile.name}
                  className={`min-w-[72px] px-3 py-3 text-center text-xs font-semibold ${m.user_id === userId ? 'text-blue-700' : 'text-gray-600'}`}
                >
                  {m.profile.name.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matches.map((match) => {
              const matchPreds = predMap[match.id] ?? {}
              return (
                <tr key={match.id} className="hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-gray-900">
                        {match.home_team && <TeamFlag teamName={match.home_team.name} size="sm" />}
                        {match.home_team?.name ?? 'TBD'}
                        <span className="text-gray-400">vs</span>
                        {match.away_team?.name ?? 'TBD'}
                        {match.away_team && <TeamFlag teamName={match.away_team.name} size="sm" />}
                      </p>
                      <p className="text-xs text-gray-400">{formatMatchDate(match.scheduled_at)}</p>
                    </div>
                  </td>
                  {playingMembers.map((m) => {
                    const pred = matchPreds[m.user_id]
                    if (!pred || pred.home_score_pred == null) {
                      return (
                        <td key={m.user_id} className="px-3 py-3 text-center text-gray-300">—</td>
                      )
                    }
                    return (
                      <td
                        key={m.user_id}
                        className={`px-3 py-3 text-center text-xs font-semibold ${m.user_id === userId ? 'text-blue-700' : 'text-gray-800'}`}
                      >
                        {pred.home_score_pred}-{pred.away_score_pred}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── HistorialTab ──────────────────────────────────────────────────────────────

function HistorialTab({
  groupMatches, members, allGroupPredictions, group, userId,
}: {
  groupMatches: MatchData[]
  members: MemberWithProfile[]
  allGroupPredictions: AllPredictionData[]
  group: GrupoData
  userId: string
}) {
  const now = new Date()
  const matches = groupMatches
    .filter((m) => new Date(m.scheduled_at) <= now && m.home_score != null)
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  const playingMembers = members
    .filter((m) => m.status === 'accepted')
    .filter((m) => group.owner_plays || m.user_id !== group.owner_id)

  const predMap: Record<number, Record<string, AllPredictionData>> = {}
  for (const p of allGroupPredictions) {
    if (!predMap[p.match_id]) predMap[p.match_id] = {}
    predMap[p.match_id][p.user_id] = p
  }

  const memberTotals: Record<string, number> = {}
  for (const m of playingMembers) {
    memberTotals[m.user_id] = 0
    for (const match of matches) {
      memberTotals[m.user_id] += predMap[match.id]?.[m.user_id]?.total ?? 0
    }
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
        <p className="text-gray-500">Aún no hay partidos completados con resultados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        {matches.length} partido{matches.length > 1 ? 's' : ''} completado{matches.length > 1 ? 's' : ''}
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Partido · Resultado
              </th>
              {playingMembers.map((m) => (
                <th
                  key={m.user_id}
                  title={m.profile.name}
                  className={`min-w-[72px] px-3 py-3 text-center text-xs font-semibold ${m.user_id === userId ? 'text-blue-700' : 'text-gray-600'}`}
                >
                  {m.profile.name.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matches.map((match) => {
              const matchPreds = predMap[match.id] ?? {}
              return (
                <tr key={match.id}>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-gray-900">
                        {match.home_team && <TeamFlag teamName={match.home_team.name} size="sm" />}
                        {match.home_team?.name ?? 'TBD'}
                        <span className="text-gray-400">vs</span>
                        {match.away_team?.name ?? 'TBD'}
                        {match.away_team && <TeamFlag teamName={match.away_team.name} size="sm" />}
                      </p>
                      <p className="text-xs font-bold text-gray-800">
                        {match.home_score}-{match.away_score}
                      </p>
                      <p className="text-xs text-gray-400">{formatMatchDate(match.scheduled_at)}</p>
                    </div>
                  </td>
                  {playingMembers.map((m) => {
                    const pred = matchPreds[m.user_id]
                    if (!pred || pred.home_score_pred == null) {
                      return (
                        <td key={m.user_id} className="px-3 py-3 text-center text-gray-300">—</td>
                      )
                    }
                    const { bg, text } = getPtsStyle(pred.total)
                    return (
                      <td key={m.user_id} className={`px-3 py-3 text-center ${bg}`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-xs font-semibold ${text} ${m.user_id === userId ? 'underline' : ''}`}>
                            {pred.total >= 10 && '⭐'}{pred.home_score_pred}-{pred.away_score_pred}
                          </span>
                          <span className={`text-xs ${text}`}>{pred.total} pts</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700">
                Total
              </td>
              {playingMembers.map((m) => (
                <td
                  key={m.user_id}
                  className={`px-3 py-3 text-center text-sm font-bold ${m.user_id === userId ? 'text-blue-700' : 'text-gray-800'}`}
                >
                  {memberTotals[m.user_id]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GrupoPageClient({
  group, rules, myMembership, isOwner, userId,
  members, allMatches, groupMatches, myPredictions, leaderboard,
  mySpecialBets, allSpecialBets,
  myPhasePredictions, allPhaseResults, allTeams, allGroupPredictions,
}: Props) {
  const memberStatus = myMembership?.status ?? null
  const isAccepted = memberStatus === 'accepted'

  const isPaid = isOwner || (myMembership?.paid ?? false)

  const adminTabs = [
    'Info', 'Configuración', 'Participantes', 'Partidos', 'Predicciones únicas',
    ...(group.owner_plays ? ['Jugar'] : []),
    'Pronósticos',
    'Historial',
    'Clasificados',
    'Cómo se puntúa',
    'Ranking',
  ]
  const participantTabs = ['Info', 'Jugar', 'Predicciones únicas', 'Pronósticos', 'Historial', 'Clasificados', 'Cómo se puntúa', 'Tabla de Posiciones']

  const tabs = isOwner ? adminTabs : participantTabs
  const [activeTab, setActiveTab] = useState<string>(tabs[0])

  // Non-member / pending / rejected states
  if (!isOwner && !isAccepted) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {group.description && <p className="mt-1 text-gray-500">{group.description}</p>}
            </div>
            {memberStatus && <StatusBadge status={memberStatus} />}
          </div>
        </div>

        {/* Status notice */}
        {memberStatus === 'pending' && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="font-semibold text-yellow-800">Tu solicitud está pendiente</p>
            <p className="mt-1 text-sm text-yellow-700">El organizador debe aceptarte para que puedas participar.</p>
          </div>
        )}
        {memberStatus === 'rejected' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">Tu solicitud fue rechazada</p>
            <p className="mt-1 text-sm text-red-700">Contacta al organizador para más información.</p>
          </div>
        )}
        {!memberStatus && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-gray-600">No eres miembro de este grupo.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Group header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
            {group.description && <p className="mt-1 text-sm text-gray-500">{group.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                Organizador
              </span>
            )}
            {memberStatus && !isOwner && <StatusBadge status={memberStatus} />}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Admin tabs */}
          {isOwner && activeTab === 'Info' && (
            <AdminInfoTab group={group} rules={rules} members={members} myMembership={myMembership} />
          )}
          {isOwner && activeTab === 'Configuración' && (
            <ConfigTab group={group} rules={rules} />
          )}
          {isOwner && activeTab === 'Participantes' && (
            <ParticipantesTab group={group} members={members} />
          )}
          {isOwner && activeTab === 'Partidos' && (
            <PartidosTab group={group} allMatches={allMatches} rules={rules} />
          )}
          {isOwner && activeTab === 'Predicciones únicas' && (
            <ApuestasTab
              groupId={group.id}
              userId={userId}
              isOwner
              ownerPlays={group.owner_plays}
              paid={isPaid}
              myBets={mySpecialBets}
              allBets={allSpecialBets}
              members={members}
              rules={rules}
            />
          )}
          {isOwner && activeTab === 'Jugar' && (
            <JugarTab
              groupId={group.id}
              matches={groupMatches}
              initialPredictions={myPredictions}
              paid={isPaid}
            />
          )}
          {isOwner && activeTab === 'Clasificados' && (
            <ClasificadosTab
              groupId={group.id}
              isOwner
              ownerPlays={group.owner_plays}
              paid={isPaid}
              rules={rules}
              myPhasePredictions={myPhasePredictions}
              allPhaseResults={allPhaseResults}
              allTeams={allTeams}
            />
          )}
          {activeTab === 'Pronósticos' && (
            <PronosticosTab
              groupMatches={groupMatches}
              members={members}
              allGroupPredictions={allGroupPredictions}
              group={group}
              userId={userId}
            />
          )}
          {activeTab === 'Historial' && (
            <HistorialTab
              groupMatches={groupMatches}
              members={members}
              allGroupPredictions={allGroupPredictions}
              group={group}
              userId={userId}
            />
          )}
          {isOwner && activeTab === 'Cómo se puntúa' && (
            <PuntuacionTab rules={rules} />
          )}
          {isOwner && activeTab === 'Ranking' && (
            <PosicionesTab leaderboard={leaderboard} userId={userId} />
          )}

          {/* Participant tabs */}
          {!isOwner && activeTab === 'Info' && (
            <ParticipantInfoTab
              group={group}
              rules={rules}
              myMembership={myMembership}
              acumulado={
                members
                  .filter((m) => m.status === 'accepted' && m.paid && (group.owner_plays || m.user_id !== group.owner_id))
                  .length * rules.bet_amount
              }
            />
          )}
          {!isOwner && activeTab === 'Jugar' && (
            <JugarTab
              groupId={group.id}
              matches={groupMatches}
              initialPredictions={myPredictions}
              paid={isPaid}
            />
          )}
          {!isOwner && activeTab === 'Predicciones únicas' && (
            <ApuestasTab
              groupId={group.id}
              userId={userId}
              isOwner={false}
              ownerPlays={group.owner_plays}
              paid={isPaid}
              myBets={mySpecialBets}
              allBets={[]}
              members={members}
              rules={rules}
            />
          )}
          {!isOwner && activeTab === 'Clasificados' && (
            <ClasificadosTab
              groupId={group.id}
              isOwner={false}
              ownerPlays={group.owner_plays}
              paid={isPaid}
              rules={rules}
              myPhasePredictions={myPhasePredictions}
              allPhaseResults={allPhaseResults}
              allTeams={allTeams}
            />
          )}
          {!isOwner && activeTab === 'Cómo se puntúa' && (
            <PuntuacionTab rules={rules} />
          )}
          {!isOwner && activeTab === 'Tabla de Posiciones' && (
            <PosicionesTab leaderboard={leaderboard} userId={userId} />
          )}
        </div>
      </div>
    </div>
  )
}
