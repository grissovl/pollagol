-- =============================================================
-- POLLAGOL - Seed data: FIFA Mundial 2026
-- Ejecutar DESPUÉS de schema.sql
-- Fuente: Calendario oficial FIFA (scores-fixtures, horario Chile CLST = UTC-4)
-- =============================================================

-- EQUIPOS
insert into teams (name, flag_emoji, group_name) values
('México',             '🇲🇽', 'A'),  -- id 1
('Sudáfrica',          '🇿🇦', 'A'),  -- id 2
('Corea del Sur',      '🇰🇷', 'A'),  -- id 3
('República Checa',    '🇨🇿', 'A'),  -- id 4
('Canadá',             '🇨🇦', 'B'),  -- id 5
('Bosnia y Herz.',     '🇧🇦', 'B'),  -- id 6
('Catar',              '🇶🇦', 'B'),  -- id 7
('Suiza',              '🇨🇭', 'B'),  -- id 8
('Brasil',             '🇧🇷', 'C'),  -- id 9
('Marruecos',          '🇲🇦', 'C'),  -- id 10
('Haití',              '🇭🇹', 'C'),  -- id 11
('Escocia',            '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C'),  -- id 12
('Estados Unidos',     '🇺🇸', 'D'),  -- id 13
('Paraguay',           '🇵🇾', 'D'),  -- id 14
('Australia',          '🇦🇺', 'D'),  -- id 15
('Turquía',            '🇹🇷', 'D'),  -- id 16
('Alemania',           '🇩🇪', 'E'),  -- id 17
('Curaçao',            '🇨🇼', 'E'),  -- id 18
('Costa de Marfil',    '🇨🇮', 'E'),  -- id 19
('Ecuador',            '🇪🇨', 'E'),  -- id 20
('Países Bajos',       '🇳🇱', 'F'),  -- id 21
('Japón',              '🇯🇵', 'F'),  -- id 22
('Suecia',             '🇸🇪', 'F'),  -- id 23
('Túnez',              '🇹🇳', 'F'),  -- id 24
('Bélgica',            '🇧🇪', 'G'),  -- id 25
('Egipto',             '🇪🇬', 'G'),  -- id 26
('Irán',               '🇮🇷', 'G'),  -- id 27
('Nueva Zelanda',      '🇳🇿', 'G'),  -- id 28
('España',             '🇪🇸', 'H'),  -- id 29
('Cabo Verde',         '🇨🇻', 'H'),  -- id 30
('Arabia Saudita',     '🇸🇦', 'H'),  -- id 31
('Uruguay',            '🇺🇾', 'H'),  -- id 32
('Francia',            '🇫🇷', 'I'),  -- id 33
('Senegal',            '🇸🇳', 'I'),  -- id 34
('Irak',               '🇮🇶', 'I'),  -- id 35
('Noruega',            '🇳🇴', 'I'),  -- id 36
('Argentina',          '🇦🇷', 'J'),  -- id 37
('Argelia',            '🇩🇿', 'J'),  -- id 38
('Austria',            '🇦🇹', 'J'),  -- id 39
('Jordania',           '🇯🇴', 'J'),  -- id 40
('Portugal',           '🇵🇹', 'K'),  -- id 41
('Rep. D. del Congo',  '🇨🇩', 'K'),  -- id 42
('Uzbekistán',         '🇺🇿', 'K'),  -- id 43
('Colombia',           '🇨🇴', 'K'),  -- id 44
('Inglaterra',         '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'L'),  -- id 45
('Croacia',            '🇭🇷', 'L'),  -- id 46
('Ghana',              '🇬🇭', 'L'),  -- id 47
('Panamá',             '🇵🇦', 'L');  -- id 48


insert into matches (phase, group_name, home_team_id, away_team_id, scheduled_at, status) values

-- ═══════════════════════════
-- JORNADA 1 (11-17 junio)
-- ═══════════════════════════

-- Jue 11
('group','A',  1,  2, '2026-06-11 15:00:00-04', 'scheduled'),  -- México vs Sudáfrica
('group','A',  3,  4, '2026-06-11 22:00:00-04', 'scheduled'),  -- Corea del Sur vs Rep.Checa

-- Vie 12
('group','B',  5,  6, '2026-06-12 15:00:00-04', 'scheduled'),  -- Canadá vs Bosnia
('group','D', 13, 14, '2026-06-12 21:00:00-04', 'scheduled'),  -- EE.UU vs Paraguay

-- Sáb 13
('group','B',  7,  8, '2026-06-13 15:00:00-04', 'scheduled'),  -- Catar vs Suiza
('group','C',  9, 10, '2026-06-13 18:00:00-04', 'scheduled'),  -- Brasil vs Marruecos
('group','C', 11, 12, '2026-06-13 21:00:00-04', 'scheduled'),  -- Haití vs Escocia
('group','D', 15, 16, '2026-06-14 00:00:00-04', 'scheduled'),  -- Australia vs Turquía (madrugada 14)

-- Dom 14
('group','E', 17, 18, '2026-06-14 13:00:00-04', 'scheduled'),  -- Alemania vs Curaçao
('group','F', 21, 22, '2026-06-14 16:00:00-04', 'scheduled'),  -- Países Bajos vs Japón
('group','E', 19, 20, '2026-06-14 19:00:00-04', 'scheduled'),  -- Costa de Marfil vs Ecuador
('group','F', 23, 24, '2026-06-14 22:00:00-04', 'scheduled'),  -- Suecia vs Túnez

-- Lun 15
('group','H', 29, 30, '2026-06-15 12:00:00-04', 'scheduled'),  -- España vs Cabo Verde
('group','G', 25, 26, '2026-06-15 15:00:00-04', 'scheduled'),  -- Bélgica vs Egipto
('group','H', 31, 32, '2026-06-15 18:00:00-04', 'scheduled'),  -- Arabia Saudita vs Uruguay
('group','G', 27, 28, '2026-06-15 21:00:00-04', 'scheduled'),  -- Irán vs Nueva Zelanda

-- Mar 16
('group','I', 33, 34, '2026-06-16 15:00:00-04', 'scheduled'),  -- Francia vs Senegal
('group','I', 35, 36, '2026-06-16 18:00:00-04', 'scheduled'),  -- Irak vs Noruega
('group','J', 37, 38, '2026-06-16 21:00:00-04', 'scheduled'),  -- Argentina vs Argelia
('group','J', 39, 40, '2026-06-17 00:00:00-04', 'scheduled'),  -- Austria vs Jordania (madrugada 17)

-- Mié 17
('group','K', 41, 42, '2026-06-17 13:00:00-04', 'scheduled'),  -- Portugal vs R.D.Congo
('group','L', 45, 46, '2026-06-17 16:00:00-04', 'scheduled'),  -- Inglaterra vs Croacia
('group','L', 47, 48, '2026-06-17 19:00:00-04', 'scheduled'),  -- Ghana vs Panamá
('group','K', 43, 44, '2026-06-17 22:00:00-04', 'scheduled'),  -- Uzbekistán vs Colombia


-- ═══════════════════════════
-- JORNADA 2 (18-23 junio)
-- ═══════════════════════════

-- Jue 18
('group','A',  4,  2, '2026-06-18 12:00:00-04', 'scheduled'),  -- Rep.Checa vs Sudáfrica
('group','B',  8,  6, '2026-06-18 15:00:00-04', 'scheduled'),  -- Suiza vs Bosnia
('group','B',  5,  7, '2026-06-18 18:00:00-04', 'scheduled'),  -- Canadá vs Catar
('group','A',  1,  3, '2026-06-18 21:00:00-04', 'scheduled'),  -- México vs Corea del Sur

-- Vie 19
('group','D', 13, 15, '2026-06-19 15:00:00-04', 'scheduled'),  -- EE.UU vs Australia
('group','C', 12, 10, '2026-06-19 18:00:00-04', 'scheduled'),  -- Escocia vs Marruecos
('group','C',  9, 11, '2026-06-19 20:30:00-04', 'scheduled'),  -- Brasil vs Haití
('group','D', 16, 14, '2026-06-19 23:00:00-04', 'scheduled'),  -- Turquía vs Paraguay

-- Sáb 20
('group','F', 21, 23, '2026-06-20 13:00:00-04', 'scheduled'),  -- Países Bajos vs Suecia
('group','E', 17, 19, '2026-06-20 16:00:00-04', 'scheduled'),  -- Alemania vs Costa de Marfil
('group','E', 20, 18, '2026-06-20 20:00:00-04', 'scheduled'),  -- Ecuador vs Curaçao
('group','F', 24, 22, '2026-06-21 00:00:00-04', 'scheduled'),  -- Túnez vs Japón (madrugada 21)

-- Dom 21
('group','H', 29, 31, '2026-06-21 12:00:00-04', 'scheduled'),  -- España vs Arabia Saudita
('group','G', 25, 27, '2026-06-21 15:00:00-04', 'scheduled'),  -- Bélgica vs Irán
('group','H', 32, 30, '2026-06-21 18:00:00-04', 'scheduled'),  -- Uruguay vs Cabo Verde
('group','G', 28, 26, '2026-06-21 21:00:00-04', 'scheduled'),  -- Nueva Zelanda vs Egipto

-- Lun 22
('group','J', 37, 39, '2026-06-22 13:00:00-04', 'scheduled'),  -- Argentina vs Austria
('group','I', 33, 35, '2026-06-22 17:00:00-04', 'scheduled'),  -- Francia vs Irak
('group','I', 36, 34, '2026-06-22 20:00:00-04', 'scheduled'),  -- Noruega vs Senegal
('group','J', 40, 38, '2026-06-22 23:00:00-04', 'scheduled'),  -- Jordania vs Argelia

-- Mar 23
('group','K', 41, 43, '2026-06-23 13:00:00-04', 'scheduled'),  -- Portugal vs Uzbekistán
('group','L', 45, 47, '2026-06-23 16:00:00-04', 'scheduled'),  -- Inglaterra vs Ghana
('group','L', 48, 46, '2026-06-23 19:00:00-04', 'scheduled'),  -- Panamá vs Croacia
('group','K', 44, 42, '2026-06-23 22:00:00-04', 'scheduled'),  -- Colombia vs R.D.Congo


-- ═══════════════════════════
-- JORNADA 3 (24-27 junio)
-- Partidos simultáneos dentro de cada grupo
-- ═══════════════════════════

-- Mié 24 — Grupos B, C, A
('group','B',  6,  7, '2026-06-24 15:00:00-04', 'scheduled'),  -- Bosnia vs Catar       (simult)
('group','B',  8,  5, '2026-06-24 15:00:00-04', 'scheduled'),  -- Suiza vs Canadá       (simult)
('group','C', 12,  9, '2026-06-24 18:00:00-04', 'scheduled'),  -- Escocia vs Brasil     (simult)
('group','C', 10, 11, '2026-06-24 18:00:00-04', 'scheduled'),  -- Marruecos vs Haití    (simult)
('group','A',  2,  3, '2026-06-24 21:00:00-04', 'scheduled'),  -- Sudáfrica vs Corea    (simult)
('group','A',  4,  1, '2026-06-24 21:00:00-04', 'scheduled'),  -- Rep.Checa vs México   (simult)

-- Jue 25 — Grupos E, F, D
('group','E', 20, 17, '2026-06-25 16:00:00-04', 'scheduled'),  -- Ecuador vs Alemania   (simult)
('group','E', 18, 19, '2026-06-25 16:00:00-04', 'scheduled'),  -- Curaçao vs C.Marfil   (simult)
('group','F', 22, 23, '2026-06-25 19:00:00-04', 'scheduled'),  -- Japón vs Suecia       (simult)
('group','F', 24, 21, '2026-06-25 19:00:00-04', 'scheduled'),  -- Túnez vs Países Bajos (simult)
('group','D', 16, 13, '2026-06-25 22:00:00-04', 'scheduled'),  -- Turquía vs EE.UU      (simult)
('group','D', 14, 15, '2026-06-25 22:00:00-04', 'scheduled'),  -- Paraguay vs Australia (simult)

-- Vie 26 — Grupos I, H, G
('group','I', 34, 35, '2026-06-26 15:00:00-04', 'scheduled'),  -- Senegal vs Irak       (simult)
('group','I', 36, 33, '2026-06-26 15:00:00-04', 'scheduled'),  -- Noruega vs Francia    (simult)
('group','H', 32, 29, '2026-06-26 20:00:00-04', 'scheduled'),  -- Uruguay vs España     (simult)
('group','H', 30, 31, '2026-06-26 20:00:00-04', 'scheduled'),  -- Cabo Verde vs Arabia  (simult)
('group','G', 28, 25, '2026-06-26 23:00:00-04', 'scheduled'),  -- Nueva Zelanda vs Bél. (simult)
('group','G', 26, 27, '2026-06-26 23:00:00-04', 'scheduled'),  -- Egipto vs Irán        (simult)

-- Sáb 27 — Grupos L, K, J
('group','L', 46, 47, '2026-06-27 17:00:00-04', 'scheduled'),  -- Croacia vs Ghana      (simult)
('group','L', 48, 45, '2026-06-27 17:00:00-04', 'scheduled'),  -- Panamá vs Inglaterra  (simult)
('group','K', 44, 41, '2026-06-27 19:30:00-04', 'scheduled'),  -- Colombia vs Portugal  (simult)
('group','K', 42, 43, '2026-06-27 19:30:00-04', 'scheduled'),  -- R.D.Congo vs Uzbekist.(simult)
('group','J', 40, 37, '2026-06-27 22:00:00-04', 'scheduled'),  -- Jordania vs Argentina (simult)
('group','J', 38, 39, '2026-06-27 22:00:00-04', 'scheduled'),  -- Argelia vs Austria    (simult)


-- ═══════════════════════════
-- 16avos DE FINAL (28 jun - 3 jul)
-- 16 partidos, horarios exactos FIFA
-- ═══════════════════════════

-- Dom 28 jun
('r32', null, null, null, '2026-06-28 15:00:00-04', 'scheduled'),

-- Lun 29 jun
('r32', null, null, null, '2026-06-29 13:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-06-29 16:30:00-04', 'scheduled'),
('r32', null, null, null, '2026-06-29 21:00:00-04', 'scheduled'),

-- Mar 30 jun
('r32', null, null, null, '2026-06-30 13:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-06-30 17:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-06-30 21:00:00-04', 'scheduled'),

-- Mié 1 jul
('r32', null, null, null, '2026-07-01 12:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-07-01 16:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-07-01 20:00:00-04', 'scheduled'),

-- Jue 2 jul
('r32', null, null, null, '2026-07-02 15:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-07-02 19:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-07-02 23:00:00-04', 'scheduled'),

-- Vie 3 jul
('r32', null, null, null, '2026-07-03 14:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-07-03 18:00:00-04', 'scheduled'),
('r32', null, null, null, '2026-07-03 21:30:00-04', 'scheduled'),


-- ═══════════════════════════
-- OCTAVOS DE FINAL (4-7 jul)
-- 8 partidos, horarios exactos FIFA
-- ═══════════════════════════

-- Sáb 4 jul
('r16', null, null, null, '2026-07-04 13:00:00-04', 'scheduled'),
('r16', null, null, null, '2026-07-04 17:00:00-04', 'scheduled'),

-- Dom 5 jul
('r16', null, null, null, '2026-07-05 16:00:00-04', 'scheduled'),
('r16', null, null, null, '2026-07-05 20:00:00-04', 'scheduled'),

-- Lun 6 jul
('r16', null, null, null, '2026-07-06 15:00:00-04', 'scheduled'),
('r16', null, null, null, '2026-07-06 20:00:00-04', 'scheduled'),

-- Mar 7 jul
('r16', null, null, null, '2026-07-07 12:00:00-04', 'scheduled'),
('r16', null, null, null, '2026-07-07 16:00:00-04', 'scheduled'),


-- ═══════════════════════════
-- CUARTOS DE FINAL (9-11 jul)
-- 4 partidos, horarios exactos FIFA
-- ═══════════════════════════

-- Jue 9 jul
('r8', null, null, null, '2026-07-09 16:00:00-04', 'scheduled'),

-- Vie 10 jul
('r8', null, null, null, '2026-07-10 15:00:00-04', 'scheduled'),

-- Sáb 11 jul
('r8', null, null, null, '2026-07-11 17:00:00-04', 'scheduled'),
('r8', null, null, null, '2026-07-11 21:00:00-04', 'scheduled'),


-- ═══════════════════════════
-- SEMIFINALES (14-15 jul)
-- ═══════════════════════════
('r4', null, null, null, '2026-07-14 15:00:00-04', 'scheduled'),
('r4', null, null, null, '2026-07-15 15:00:00-04', 'scheduled'),


-- ═══════════════════════════
-- TERCER PUESTO (18 jul)
-- ═══════════════════════════
('r2', null, null, null, '2026-07-18 17:00:00-04', 'scheduled'),


-- ═══════════════════════════
-- FINAL (19 jul) — MetLife Stadium
-- ═══════════════════════════
('final', null, null, null, '2026-07-19 15:00:00-04', 'scheduled');