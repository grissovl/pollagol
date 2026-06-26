# PROJECT_LOG — PollaGol
_Última actualización: 2026-06-26_

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
- PWA: instalable iOS/Android, íconos personalizados
- Deploy: pollagol-omega.vercel.app, Vercel + Supabase, 14 usuarios activos

## Sesión anterior
- Fix crítico: leaderboard mostraba 0 para todos — query superaba límite URL de Supabase con 827 IDs, fix con chunks de 200
- Tabs Pronósticos e Historial implementados para participantes
- Colapsar partidos con resultado en panel admin (tab Partidos)
- Botón copiar pronósticos por partido en tab Pronósticos

## Decisiones técnicas
- Resultados de partidos de eliminatorias = marcador a 90/120 min, sin penales
- Leaderboard usa chunks de 200 para evitar límite URL PostgREST (~30k chars)
- Bonos de fase: opción B (selección cuando se conocen clasificados reales)
- Server actions para todas las mutaciones, no API routes
- Scripts: usar `npm run dev:clean` en Windows para evitar caché corrupta de .next

## Pendientes priorizados
- [ ] Actualizar fixture 16avos: ingresar home_team_id/away_team_id cuando se cierren los grupos (27 jun)
- [ ] Ingresar clasificados reales en tab Clasificados para habilitar bonos de 16avos
- [ ] Generar SQL de 16avos con cruces oficiales (Gino pasa Excel con 1°/2° por grupo + mejores terceros)

## Problemas conocidos
- Ninguno activo
