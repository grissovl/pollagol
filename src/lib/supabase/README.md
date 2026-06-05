# Supabase — Base de datos Pollagol

## Archivos SQL

| Archivo | Descripción |
|---------|-------------|
| `schema.sql` | Tablas, RLS policies y triggers |
| `seed.sql` | 48 equipos + 104 partidos del Mundial 2026 |
| `rls-patch.sql` | **Parche RLS para proyectos existentes** (ver abajo) |

## Cómo aplicar

Todos los archivos se ejecutan en el **SQL Editor** del dashboard de Supabase (ícono de terminal en la barra lateral).

### Instalación desde cero

```
schema.sql  →  seed.sql
```

### Proyecto existente — RLS fix obligatorio

Si ya ejecutaste `schema.sql` y `seed.sql` pero la app muestra **"0 partidos"** en el paso 3,
es porque Supabase habilitó RLS automáticamente en `matches` y `teams` sin policies de SELECT.
La `anon` key ve 0 filas sin error (comportamiento de PostgreSQL con RLS activo y sin policy).

**Ejecuta `rls-patch.sql`** en el SQL Editor. El script es idempotente (no falla si ya existe la policy).

Verificación rápida:
```sql
select schemaname, tablename, policyname
from   pg_policies
where  tablename in ('matches', 'teams');
-- Debe retornar al menos 2 filas con policyname = 'matches_select_public' y 'teams_select_public'
```

---

## Contenido del seed

### Equipos (48 en total)

12 grupos (A–L) de 4 equipos cada uno.  
Los dos últimos equipos del Grupo L figuran como **Repechaje 1** y **Repechaje 2** (ganadores de los repechajes intercontinentales, por definir).

### Partidos

| Fase | Cantidad | Fechas (hora Chile UTC-4) |
|------|----------|---------------------------|
| Fase de grupos | 72 | 11 jun – 1 jul 2026 |
| Ronda de 32 | 16 | 3 – 8 jul 2026 |
| Ronda de 16 | 8 | 10 – 13 jul 2026 |
| Cuartos de final | 4 | 15 – 16 jul 2026 |
| Semifinales | 2 | 18 – 19 jul 2026 |
| Tercer lugar | 1 | 22 jul 2026 |
| Final | 1 | 23 jul 2026 |
| **Total** | **104** | |

Los partidos de eliminatorias se insertan con `home_team_id = null` y `away_team_id = null` (por definir según resultados). Las fechas y horarios de eliminatorias son aproximados y deben verificarse contra el calendario oficial de FIFA.

### Jornada 3 — partidos simultáneos

Los dos partidos de cada grupo en la tercera jornada comparten exactamente el mismo `scheduled_at`. Esto permite mostrar el cierre de grupo como un evento único y activar el lock automático de predicciones al mismo tiempo para ambos partidos.

---

## Notas de desarrollo

- Los timestamps usan offset `-04` (CLT, hora Chile invierno). PostgreSQL los convierte a UTC internamente (`timestamptz`).
- El trigger `on_auth_user_created` crea automáticamente el perfil de cada usuario al registrarse.
- La función `lock_predictions_for_match(match_id)` se debe llamar manualmente (cron o edge function) ~15 minutos antes de cada partido.
- `teams` y `matches` tienen RLS habilitado con policy `SELECT USING (true)` — cualquiera puede leer el fixture. Sin esa policy, la `anon` key recibe 0 filas silenciosamente (sin error HTTP).
