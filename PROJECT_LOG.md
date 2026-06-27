# PROJECT_LOG — PollaGol
_Última actualización: 2026-06-27_

## Estado actual
- Auth: email + Google OAuth funcionando en producción
- Grupos: crear/unirse por código, toggle owner_plays, restricción crear solo admin@pollagol.cl
- Predicciones de partidos: autoguardado, cierre automático 15 min antes, bloqueo si pago pendiente
- Predicciones únicas: Campeón (20pts), Balón/Bota/Guante de Oro (15/15/10pts), cierre 11 Jun 14:45
- Sistema de puntuación: marcador exacto, ganador, gol acertado, predicción única — recálculo manual desde panel admin
- Bonos de fase eliminatoria: tablas phase_predictions y phase_results creadas, tab Clasificados implementado
- Ranking: filtrado por paid=true, desempate ME→GA→GoA, fix chunks para evitar límite URL Supabase
- Panel admin: tabs Info, Configuración, Participantes, Partidos, Predicciones únicas, Clasificados, Jugar, Ranking
- Vista participante: tabs Info, Jugar, Pronósticos, Historial, Clasificados, Predicciones únicas, Cómo se puntúa, Ranking
- Historial: colores por puntaje (0=gris, 1-5=escala verdes, 10=dorado ⭐)
- Pronósticos: botón copiar por partido (formato texto alineado)
- Asignación manual de equipos en eliminatorias: sección "Equipos de eliminatorias" en tab Partidos (solo organizador), dropdowns filtrados por clasificados de la fase anterior (phase_results)
- PWA: instalable iOS/Android, íconos personalizados
- Deploy: pollagol-omega.vercel.app, Vercel + Supabase, 14 usuarios activos

## Sesión anterior (2026-06-27)
- Asignación manual de equipos en partidos de eliminatorias: nueva sección colapsable en tab Partidos del organizador
  - Dropdowns muestran solo los equipos clasificados de la fase previa (phase_results), no los 48 equipos
  - Si no hay clasificados registrados, muestra aviso para ir al tab Clasificados primero
  - Acción `saveMatchTeams` con guard `assertOwner` — actualiza `matches.home_team_id/away_team_id`
  - `MatchData` ahora incluye `home_team_id` y `away_team_id`
- Fix: instalar paquete `flag-icons` que faltaba en node_modules

## Decisiones técnicas
- Resultados de partidos de eliminatorias = marcador a 90/120 min, sin penales
- Leaderboard usa chunks de 200 para evitar límite URL PostgREST (~30k chars)
- Bonos de fase: opción B (selección cuando se conocen clasificados reales)
- Server actions para todas las mutaciones, no API routes
- Scripts: usar `npm run dev:clean` en Windows para evitar caché corrupta de .next
- `matches` es tabla compartida entre grupos — asignar equipos en un partido lo actualiza globalmente (comportamiento correcto, el torneo es objetivo)

## Pendientes priorizados
- [ ] Ingresar clasificados reales de grupos en tab Clasificados (habilita dropdowns de 16avos y bonos)
- [ ] Asignar equipos a los partidos de r32 una vez cerrados los grupos (27 jun)

## Problemas conocidos
- Ninguno activo
