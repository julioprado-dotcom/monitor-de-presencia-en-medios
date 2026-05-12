# PASO 1 — DIAGNOSTICO DE FUENTES Y MEDIOS
## DECODEX Bolivia — ONION200 v0.15.0
**Fecha:** 2026-05-13
**Commit:** pendiente

---

## 1. Fuentes con Estado (30)

### Activas (19) — Capa 2: Headlines
| # | Medio | Tipo | Check | Pais | Freq |
|---|-------|------|-------|------|------|
| 1 | ABI | Agencia estatal | head | BO | 6h |
| 2 | Bolivia Verifica | Fact-checking | head | BO | 6h |
| 3 | Bolpress | Portal | zai | BO | 6h |
| 4 | CEDIB | Documentación | head | BO | 6h |
| 5 | Correo del Sur | Digital+Impreso | head | BO | 6h |
| 6 | El Día | Digital | head | BO | 6h |
| 7 | El Mundo | Digital | zai | BO | 6h |
| 8 | El País (Tarija) | Digital | zai | BO | 6h |
| 9 | El Periódico | Digital+Impreso | head | BO | 6h |
| 10 | El Potosí | Digital+Impreso | zai | BO | 6h |
| 11 | La Razón | Digital | zai | BO | 6h |
| 12 | La Voz de Tarija | Digital | head | BO | 6h |
| 13 | Leo.bo | Digital | head | BO | 6h |
| 14 | Los Tiempos | Digital+Impreso | fingerprint | BO | 6h |
| 15 | Opinión | Digital | zai | BO | 6h |
| 16 | Resumen Latinoamericano | Portal | head | BO | 6h |
| 17 | Unitel | TV | head | BO | 6h |
| 18 | Visión 360 | Digital | head | BO | 6h |
| 19 | eju.tv | Digital | head | BO | 6h |

### Creadas sin respuesta (11) — Capa 0
ANF, ATB, Abya Yala TV, Ahora El Pueblo, Bolivia TV, El Deber, El Diario, La Patria, Radio Kawsachun Coca, Red Uno, Sol de Pando

## 2. Medios sin FuenteEstado (19)

Incluye: ERBOL, Página Siete, IBCE, SENASAG, 8 medios de café (PDG, OIC, SCA, etc.), Coffee Review, Coffee Universe, Sprudge, Investing.com, TradingView, Reuters, World Coffee Research, Agropecuario, La Estrella, La Lupa, Norte de Potosí

**NOTA:** 7 de estos sin URL (La Estrella, La Lupa, Norte de Potosí)

## 3. RSS Test — RESULTADO CRITICO

| Medio | Status | Detalle |
|-------|--------|---------|
| ERBOL | 404 | RSS no existe |
| Bolpress | FAIL | Conexión rechazada |
| La Razón | 403 | Cloudflare |
| Página Siete | 403 | Cloudflare |
| El Deber | 403 | Cloudflare |
| Opinión | 403 | Cloudflare |
| ABI | FAIL | Conexión rechazada |
| ANF | FAIL | Conexión rechazada |
| Cambió | FAIL | Conexión rechazada |
| Los Tiempos | 404 | RSS no existe |
| Correo del Sur | 404 | RSS no existe |
| El Diario | 404 | RSS no existe |
| **Perfect Daily Grind** | **OK** | **220KB RSS funcional** |

**CONCLUSION:** 12/13 medios bolivianos BLOQUEAN RSS. Solo estrategia viable: HTML homepage scraping + Z.ai page_reader.

## 4. Keywords Disponibles (713 total)

| Lente | Keywords |
|-------|----------|
| Movilización Social | 87 |
| Café y Economías Regionales | 197 |
| Minería y Metales | 36 |
| Pueblos Indígenas | 35 |
| Hidrocarburos | 30 |
| Corrupción e Impunidad | 28 |
| Medio Ambiente | 28 |
| Género y Diversidad | 16 |
| Litio y Energía | 18 |

| Eje Estructural | Keywords |
|-----------------|----------|
| Recursos Naturales | 42 |
| Gobierno, Poder | 30 |
| Economía, Política Económica | 31 |
| Justicia, DDHH | 25 |
| Salud, Educación | 25 |
| Geopolítica, R. Int. | 25 |
| Procesos Electorales | 23 |
| Movilización Social | 12 |
| Territorio, DDCC | 25 |

## 5. Estado Actual DB

| Métrica | Valor |
|---------|-------|
| Total menciones | 217 |
| Menciones con lentes | 228 |
| Lentes activos | 9 |
| Ejes estructurales | 9 |
| Medios totales | 49 |
| Fuentes activas | 19 |
| Keywords totales | 713 |

## 6. DECISIONES PARA PASO 2

1. **Fuentes a usar:** 19 activas + ERBOL + Página Siete (sin estado pero principales)
2. **Método:** HTML homepage (fetch directo) — si falla, marcar como bloqueado
3. **Scoring:** 713 keywords de lentes + ejes (score >= 2 para considerar, >= 3 para crear)
4. **Sin Z.ai** — usar solo fetch directo para evitar rate-limit
5. **Max 10 artículos por fuente** — delay 4s entre requests
6. **Ordenar por nivel:** N1 primero, luego N2, luego N3
