'use client'

import type { RulesData } from './types'

interface Props {
  rules: RulesData
}

const REAL = { home: 2, away: 0, homeTeam: 'Uruguay', awayTeam: 'Francia' }

function calcScore(
  pred: { home: number; away: number },
  rules: RulesData,
): { pts: number; items: string[] } {
  if (pred.home === REAL.home && pred.away === REAL.away) {
    return { pts: rules.pts_exact, items: [`Marcador exacto: +${rules.pts_exact} pts`] }
  }
  const items: string[] = []
  let pts = 0
  if (Math.sign(pred.home - pred.away) === Math.sign(REAL.home - REAL.away)) {
    pts += rules.pts_winner
    items.push(`Ganador acertado: +${rules.pts_winner} pts`)
  }
  if (pred.home === REAL.home) { pts += rules.pts_goal; items.push(`Gol local acertado: +${rules.pts_goal} pts`) }
  if (pred.away === REAL.away) { pts += rules.pts_goal; items.push(`Gol visitante acertado: +${rules.pts_goal} pts`) }
  return { pts, items }
}

const EXAMPLES = [
  {
    title: 'Marcador exacto',
    note: 'Solo suma pts_exact. No acumula ganador ni goles.',
    preds: [{ home: 2, away: 0 }],
  },
  {
    title: 'Ganador + gol acertado',
    note: 'Distintos marcadores, mismos puntos: lo que importa es ganador y goles individuales.',
    preds: [{ home: 3, away: 0 }, { home: 1, away: 0 }],
  },
  {
    title: 'Sin acierto',
    note: 'Ni el ganador ni ningún gol coinciden.',
    preds: [{ home: 0, away: 1 }],
  },
  {
    title: 'Solo gol acertado',
    note: 'Se acumula el punto de "Gol acertado" por cada equipo cuyos goles coincidan, incluso sin acertar el ganador.',
    preds: [{ home: 0, away: 0 }, { home: 2, away: 2 }],
  },
]

const SPECIAL = [
  { icon: '🏆', label: 'Campeón del Mundo', pts: 20 },
  { icon: '⚽', label: 'Balón de Oro', pts: 15 },
  { icon: '👟', label: 'Bota de Oro', pts: 15 },
  { icon: '🧤', label: 'Guante de Oro', pts: 10 },
]

export default function PuntuacionTab({ rules }: Props) {
  const rulesRows = [
    { label: 'Marcador exacto', pts: rules.pts_exact, desc: 'Predices el marcador exacto del partido' },
    { label: 'Ganador o empate', pts: rules.pts_winner, desc: 'Aciertas quién gana o si es empate' },
    { label: 'Gol acertado', pts: rules.pts_goal, desc: 'Por cada equipo cuyos goles predices correctamente' },
    { label: 'Predicción única', pts: rules.pts_unique, desc: 'Eres el único del grupo con ese marcador exacto' },
  ]
  const bonusRows = [
    { label: 'Bono 16avos', pts: rules.pts_r32_bonus },
    { label: 'Bono octavos', pts: rules.pts_r16_bonus },
    { label: 'Bono cuartos', pts: rules.pts_r8_bonus },
    { label: 'Bono semifinales', pts: rules.pts_r4_bonus },
    { label: 'Bono final', pts: rules.pts_final_bonus },
  ]

  return (
    <div className="space-y-8">

      {/* ── Sección 1: Tabla de reglas ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Puntos por predicción de partido</h3>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {rulesRows.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{row.label}</p>
                    <p className="text-xs text-gray-400">{row.desc}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-sm font-bold text-blue-700">
                      {row.pts} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
          <p className="border-b border-amber-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Bonos eliminatorias
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-amber-100">
              {bonusRows.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-2.5 text-gray-700">{row.label}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-amber-700">{row.pts} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Sección 2: Ejemplos ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Ejemplos con valores reales</h3>
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-500">Resultado real:</span>
          <span className="font-semibold text-gray-800">
            {REAL.homeTeam} {REAL.home} — {REAL.away} {REAL.awayTeam}
          </span>
        </div>

        <div className="space-y-3">
          {EXAMPLES.map((ex) => (
            <div key={ex.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-0.5 font-semibold text-gray-800">{ex.title}</p>
              <p className="mb-3 text-xs text-gray-400">{ex.note}</p>
              <div className="space-y-2">
                {ex.preds.map((pred) => {
                  const { pts, items } = calcScore(pred, rules)
                  const isExact = pred.home === REAL.home && pred.away === REAL.away
                  return (
                    <div
                      key={`${pred.home}-${pred.away}`}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${pts > 0 ? 'bg-green-50' : 'bg-red-50'}`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Predicción: {REAL.homeTeam} {pred.home} — {pred.away} {REAL.awayTeam}
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {items.length > 0 ? (
                            items.map((item) => (
                              <li key={item} className="text-xs text-green-700">✓ {item}</li>
                            ))
                          ) : (
                            <li className="text-xs text-red-500">✗ Sin aciertos → 0 pts</li>
                          )}
                          {isExact && rules.pts_unique > 0 && (
                            <li className="text-xs text-purple-600">
                              ✦ Si eres el único con ese marcador: +{rules.pts_unique} pts extra
                            </li>
                          )}
                        </ul>
                      </div>
                      {pts > 0 && (
                        <span className="shrink-0 rounded-full bg-green-200 px-2.5 py-1 text-sm font-bold text-green-800">
                          {pts} pts
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sección 3: Bonos de fases eliminatorias ── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Bonos de fases eliminatorias</h3>
          <p className="mt-1 text-sm text-gray-500">
            Al inicio de cada fase eliminatoria, debes seleccionar los equipos que crees que van a
            clasificar a la siguiente ronda. Si aciertas <span className="font-semibold text-gray-700">TODOS</span> los
            equipos de esa fase, ganas el bono completo. Si fallas aunque sea uno, no sumas puntos.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-amber-50 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <th className="px-4 py-2.5 text-left">Fase</th>
                <th className="px-4 py-2.5 text-center text-gray-500 font-normal normal-case tracking-normal">Seleccionar</th>
                <th className="px-4 py-2.5 text-right">Bono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: '16avos de final', pick: '16 de 32 equipos', pts: rules.pts_r32_bonus },
                { label: 'Octavos de final', pick: '8 de 16 equipos', pts: rules.pts_r16_bonus },
                { label: 'Cuartos de final', pick: '4 de 8 equipos', pts: rules.pts_r8_bonus },
                { label: 'Semifinales',      pick: '2 de 4 equipos', pts: rules.pts_r4_bonus },
                { label: 'Final',            pick: '1 campeón',      pts: rules.pts_final_bonus },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{row.label}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-gray-400">{row.pick}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-700">
                      {row.pts} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">
          Las selecciones se abren cuando el admin ingresa los clasificados de la fase anterior y se
          cierran 15 minutos antes del primer partido de cada fase.
        </p>
      </section>

      {/* ── Sección 4: Predicciones únicas ── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Predicciones únicas del torneo</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Se ingresan antes del torneo y se bloquean 15 minutos antes del primer partido.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {SPECIAL.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <span className="text-2xl leading-none">{s.icon}</span>
              <p className="flex-1 text-sm font-medium text-gray-800">{s.label}</p>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-sm font-bold text-blue-700">
                {s.pts} pts
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
