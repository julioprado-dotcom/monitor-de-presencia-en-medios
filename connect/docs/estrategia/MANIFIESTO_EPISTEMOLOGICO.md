# MANIFIESTO EPISTEMOLÓGICO DECODEX

**"Traduciendo señales en patrones de poder"**

*Versión: 1.0 — 15 de mayo de 2026*  
*Clasificación: Interno — Referencia fundacional para agentes (humanos e IA)*

---

## PREÁMBULO

Este documento captura el alma de DECODEX: no su sintaxis, sino su intención. Es la fuente de verdad filosófica a la que cualquier agente —humano o artificial— debe recurrir para comprender no solo qué hace el sistema, sino por qué lo hace de esa manera y no de otra.

Todo lo que aquí se afirma está extraído de los documentos fundacionales y el código fuente del proyecto. Las contradicciones entre fuentes se señalan explícitamente con la marca `[PENDIENTE DE DEFINICIÓN]`.

---

## A. ONTOLOGÍA — ¿Qué es la realidad para DECODEX?

### A.1 La realidad como ecosistema de señales

Para DECODEX, la realidad mediática no es un conjunto de notas aisladas, sino un ecosistema de señales que tiene estructura, dirección e intención. El sistema concibe el espacio público boliviano como un territorio atravesado por flujos informativos que emanan de múltiples fuentes, atraviesan distintos medios y cristalizan en **menciones**: unidades atómicas de presencia mediática.

El ecosistema tiene capas, como una cebolla —de ahí el nombre del motor interno, **ONION200**. Cada capa transforma la señal:
1. **Captura:** Extrae datos crudos.
2. **Indicadores:** Contextualiza con métricas macroeconómicas.
3. **Procesamiento:** Clasifica, deduplica y enriquece.
4. **Entrega:** Destila la inteligencia en productos consumibles.

La realidad no es estática: es un proceso en cuatro fases.

### A.2 Las entidades del universo DECODEX

El sistema reconoce las siguientes entidades como ontológicamente reales:

- **Persona (Actor):** Cualquier individuo con presencia pública relevante (legisladores, ministros, dirigentes, empresarios). La base inicial contiene 173 legisladores (2025-2030), pero el modelo es abierto. Un actor existe en la medida en que los medios lo nombran.
- **Medio (Fuente):** Canal de publicación con cinco niveles de confianza: corporativos nacionales (15), regionales (9), alternativos/independientes (6), redes sociales (continuo) y repositorio extendido TSE (345 medios).
- **Mención:** Unidad fundamental de realidad. Registro de que un actor fue nombrado en un medio en un momento determinado. Puede tener múltiples ejes temáticos (máx. 3), tratamiento periodístico, intención y preguntas fundamentales respondidas.
- **Eje Temático:** Categoría de clasificación jerárquica (12 raíz + 35 sub-clasificaciones) construida deliberadamente para el contexto boliviano (Hidrocarburos, Minería, Movimientos Sociales, etc.).
- **Indicador ONION200:** Dato macroeconómico o sectorial capturado por vías no mediáticas (APIs, scraping oficial) que sirve como contexto de referencia (Tipo de cambio BCB, LME, RIN, IPC).
- **Producto:** Forma final de entrega al usuario, tipificada con frecuencia, horario, formato y protocolo propio.

### A.3 Lo que DECODEX no es

1. **No es un medio de comunicación:** No produce noticias, no editorializa, no opina. Existe en el plano de la observación metamediática.
2. **No es sentiment analysis:** Clasifica **tratamiento periodístico** (informativo, crítico, elogioso, agresivo), no sentimiento emocional. Esta distinción es codificada como regla inmutable.

### A.4 Hecho vs. rumor vs. señal

- **Hecho verificado:** Mención respaldada por fuente identificable con enlace activo y versión cruzada.
- **Rumor:** Información no verificable o de fuente única sin corroboración `[PENDIENTE DE DEFINICIÓN]`.
- **Señal:** Patrón estadísticamente significativo que emerge de la agregación de menciones.

---

## B. EPISTEMOLOGÍA — ¿Cómo conoce DECODEX?

### B.1 El axioma fundamental: la fuente como verdad

La verdad del sistema es la verdad de la fuente. El sistema no aspira a una verdad objetiva trascendente; aspira a registrar con fidelidad lo que los medios publicaron.

**Nueve principios inmutables:**
1. **Fidelidad al texto fuente:** "Nunca mejorar, suavizar ni reinterpretar el tono original."
2. **Cero invención:** "Si el texto no responde una pregunta, devolver null."
3. **Clasificación fiel:** Si el texto es 100% crítico, clasificar como 100% crítico. No inventar balance.
4. **Terminología controlada:** Solo vocabulario permitido.
5. **Separar causa de intención:** El "por qué" y el "para qué" son dimensiones independientes.
6. **Contexto boliviano obligatorio:** Aplicación de conocimiento político e institucional local.
7. **Resumen fiel:** Máximo 200 palabras, reflejando calidad y tono original.
8. **Ironía como categoría editorial:** Detectada como tratamiento, no como sentimiento.
9. **Intención y tratamiento independientes:** Un medio puede buscar informar (intención) tratando al actor con hostilidad (tratamiento).

### B.2 El método: Pipeline de cuatro fases

1. **Captura (extracción):** Texto completo automatizado mediante scraping. Requisito arquitectónico D2.
2. **Triage (filtrado local sin IA):** Sistema de keywords locales. Principio de economía cognitiva: "Es más barato procesar una nota irrelevante que perder una relevante." Preferencia por falsos positivos sobre falsos negativos.
3. **Procesamiento (análisis con IA):** Clasificación multidimensional con GLM (vía z-ai-web-dev-sdk). Reglas anti-alucinación estrictas: "Solo puedes hacer referencia a las menciones proporcionadas."
4. **Entrega (destilación):** Agrupación y transformación en productos. **Regla de cita obligatoria:** "Cada dato debe ser rastreable a una mención específica. Formato: (Fuente: nombre del medio)."

### B.3 El papel de la IA: herramienta, no juez

- **Motor exclusivo:** GLM (vía z-ai-web-dev-sdk). Modelos occidentales (GPT, Claude, Gemini) prohibidos por decisión D1 (soberanía tecnológica).
- **Corset de reglas:** No introduce contexto externo no proporcionado. No hace análisis prospectivo sin tendencias observadas. No usa lenguaje político ni juicios de valor.
- **Tensión epistemológica:** Diferencia entre "conocimiento del contexto boliviano" (permitido) y "contexto externo no proporcionado" (prohibido) `[PENDIENTE DE DEFINICIÓN]`.

### B.4 Deduplicación: la verdad como evento

Principio: "El mismo evento publicado por múltiples medios es una sola realidad, no múltiples."
- Reconoce reproducción de cables de agencia (ABI, ERBOL, EFE) como eventos únicos.
- **Fallback conservador:** Ante duda, se clasifican como eventos distintos para preservar la posibilidad de análisis posteriores.

### B.5 Indicadores: la verdad objetiva como coordenada

Datos numéricos capturados sin mediación de LLM (pipeline 100% regex). Función doble:
1. Contexto de referencia para clasificar notas económicas.
2. Insumos para generación de productos.
Permiten determinar si una noticia es real, exagerada o inventada.

---

## C. AXIOLOGÍA — ¿Qué valores guían el código?

### C.1 Pluralidad de fuentes (sobre neutralidad)

Valor supremo: **Pluralidad**, no neutralidad. "La imparcialidad no existe."
- El sistema no busca "equilibrar" la cobertura. Refleja la proporción real del ecosistema (ej. 10 críticas vs 5 elogios = 10/5, no 50/50).
- La corrección del sesgo es una propiedad emergente del método, no una acción del sistema.

### C.2 Transparencia metodológica

DECODEX no pide confianza; pide verificación.
- Cita obligatoria en cada producto.
- Arquitectura documentada (19 decisiones en CONTEXTO.md).
- Prompts de IA inspeccionables.

### C.3 Fidelidad al texto (sobre la interpretación)

No se suavizan críticas ni se equilibran elogios. La IA tiene prohibido reinterpretar. Oposición radical a sistemas que "normalizan" resultados para dashboards agradables.

### C.4 Soberanía tecnológica

Decisión de usar exclusivamente GLM y prohibir modelos occidentales es una declaración de soberanía sobre el procesamiento de datos mediáticos de Bolivia.

### C.5 Rigor periodístico sin ser periodistas

Adopta estándares periodísticos (cita de fuentes, verificación de enlaces) sin ser un medio.
- Estándar obligatorio: "Datos reales, no placeholder. Si no hay datos: 'Cobertura limitada para el periodo.'"

### C.6 Accesibilidad sin simplificación

Ética de comunicación: "Un legislador y un estudiante universitario deben poder entender cualquier boletín por igual."
- Rechazo a jerga técnica y simplificación excesiva.
- "Datos con contexto: '23 menciones' no dice nada; '23 menciones en 6 horas, el triple del promedio diario' sí."

### C.7 Verdad sobre conveniencia

Prioriza la verdad sobre la conveniencia del producto. Un producto con datos escasos pero veraces es preferible a uno completo pero fabricado.

---

## D. PRAXEOLOGÍA — ¿Cómo actúa DECODEX?

### D.1 Ante la incertidumbre: el silencio sobre la fabricación

Acción por defecto: **Silencio (null)** o declaración explícita de limitación ("Cobertura limitada"). Mejor admitir ignorancia que fabricar conocimiento.

### D.2 Ante el sesgo: el reconocimiento, no la corrección

DECODEX no corrige sesgos; los registra. La pluralidad de fuentes opera como mecanismo correctivo implícito.

### D.3 Ante la alucinación: la prevención por diseño

**7 reglas anti-alucinación de products.ts (cumplimiento OBLIGATORIO):**
1. Restricción de fuentes: Solo menciones proporcionadas. Cero datos externos.
2. Personajes públicos: Solo si aparecen explícitamente nombrados.
3. Cita obligatoria: Cada dato rastreable. Formato: `(Fuente: nombre del medio)`.
4. Neutralidad de lenguaje: Cero lenguaje político, de opinión o juicio de valor.
5. Metadatos prohibidos: Cero información interna del sistema en productos.
6. Idioma boliviano: Todo el contenido en español boliviano.
7. Verificación interna: Cada afirmación respaldada por al menos una mención antes de generar.

### D.4 Ante la urgencia: la tensión como categoría operativa

Tres niveles de tensión (ESTANDAR_PRODUCTOS.md):
- **ALTA (rojo):** Afecta políticas públicas o DDHH, múltiples fuentes, potencial de escalamiento.
- **MEDIA (ámbar):** Tema recurrente con desarrollo nuevo, 2-3 fuentes.
- **BAJA (verde):** Informativo sin tensión inmediata, 1 fuente.

### D.5 Ante la ética de publicación: el mapa, no el territorio

Frase fundacional: **"Entregamos el mapa, no el territorio."**
- El sistema muestra qué existe, en qué proporción, con qué tratamiento. El usuario saca sus propias conclusiones.
- La ausencia en el mapa es tan informativa como la presencia.

### D.6 Ante el error: el falso positivo como virtud

Diseño ético: "Prefiere falso positivo sobre falso negativo." En un ecosistema donde la información es poder, la omisión es el error más grave.

### D.7 Ante el contexto boliviano: el conocimiento local como requisito

Sistema diseñado desde Bolivia para Bolivia.
- Constitución Política del Estado (CPE 2009) como marco operativo.
- Ejes temáticos adaptados a la realidad local (COB, TSE, Hidrocarburos, etc.).

### D.8 Ante la verdad histórica: Evidencia Forense Bajo Demanda

DECODEX opera bajo el principio de **"Blindaje Histórico"**: cada mención procesada es capturada en su estado original (HTML estático o imagen) y sellada criptográficamente (SHA-256) en el momento de su ingesta.

- **Almacenamiento Universal:** El sistema guarda la evidencia de TODAS las menciones, independientemente del nivel del usuario. Esto garantiza que la verdad histórica esté preservada incluso si el medio original modifica o borra la nota.
- **Acceso Diferenciado:**
  - *Niveles Básico/Profesional:* Acceden solo a metadatos textuales (Fuente, Fecha, URL).
  - *Nivel Premium:* Tiene derecho a solicitar la "Evidencia Forense" (archivo original + hash) bajo demanda.
- **No Exposición Automática:** La evidencia cruda nunca se incluye en boletines o reportes automáticos. Se entrega únicamente mediante solicitud expresa vía API segura.
- **Integridad:** El hash permite al usuario verificar que el archivo entregado no ha sido alterado desde su captura.

---

## CONTRADICCIONES IDENTIFICADAS

| # | Contradicción | Fuente A | Fuente B | Marca |
|---|---|---|---|---|
| 1 | "Sentimiento" vs. "Tratamiento periodístico" | strategy.ts menciona "sentimiento público" | Acta y extractor prohíben "sentimiento" | `[PENDIENTE]` |
| 2 | "Contexto externo permitido" vs. "prohibido" | extractor exige "contexto boliviano" | products prohíbe "contexto externo" | `[PENDIENTE]` |
| 3 | "Neutralidad" vs. "Imparcialidad no existe" | ESTANDAR exige "neutralidad en etiqueta" | Acta declara "imparcialidad no existe" | `[PENDIENTE]` |
| 4 | PostgreSQL (prod) vs. SQLite (dev) | Acta menciona PostgreSQL para producción | Código usa SQLite operativo | `[PENDIENTE]` |

---

## PRINCIPIOS INMUTABLES (RESUMEN)

Estos principios no pueden modificarse sin revisión formal:

1. **No somos jueces ni parte.** Reflejamos la realidad mediática, no la evaluamos.
2. **La fuente es la verdad.** Si la fuente lo dijo, el sistema lo registra. Si no, no lo inventa.
3. **Fidelidad al texto.** Nunca mejorar, suavizar, reinterpretar ni equilibrar.
4. **Pluralidad sobre neutralidad.** Compromiso con la diversidad de fuentes.
5. **El mapa, no el territorio.** El sistema entrega información para que el usuario decida.
6. **Cita obligatoria.** Toda afirmación es rastreable a una fuente específica.
7. **Silencio sobre fabricación.** Cuando no hay datos, se declara limitación.
8. **Tratamiento, no sentimiento.** Clasificamos postura editorial, no emociones.
9. **Soberanía tecnológica.** Solo GLM. Datos de Bolivia, procesados bajo control boliviano.
10. **Falso positivo sobre falso negativo.** Es mejor procesar ruido que perder señal.
11. **Blindaje Histórico.** Evidencia forense capturada y sellada para toda mención.

---

*Documento generado a partir del análisis de: Acta de Nacimiento v2.0, CONTEXTO.md, ESTANDAR_PRODUCTOS.md, README.md, extractor-menciones.ts, products.ts, strategy.ts, deduplicacion.ts, keyword-triaje.ts.*
