# 00 — MANIFIESTO EPISTEMOLÓGICO DECODEX

> *"Traduciendo señales en patrones de power"*

**Versión:** 1.0 — 15 de mayo de 2026
**Clasificación:** Interno — Referencia fundacional para agentes (humanos e IA)
**Fuentes:** Acta de Nacimiento v2.0, CONTEXTO.md, ESTANDAR_PRODUCTOS.md, README.md, extractor-menciones.ts, products.ts, deduplicacion.ts, keyword-triaje.ts

---

## PREÁMBULO

Este documento captura el alma de DECODEX: no su sintaxis, sino su intención. Es la fuente de verdad filosófica a la que cualquier agente —humano o artificial— debe recurrir para comprender no solo qué hace el sistema, sino por qué lo hace de esa manera y no de otra.

Todo lo que aquí se afirma está extraído de los documentos fundacionales y el código fuente del proyecto. No se ha inventado nada. Las contradicciones entre fuentes se señalan explícitamente con la marca `[PENDIENTE DE DEFINICIÓN]`.

---

## A. ONTOLOGÍA — ¿Qué es la realidad para DECODEX?

### A.1 La realidad como ecosistema de señales

Para DECODEX, la realidad mediática no es un conjunto de notas aisladas, sino un **ecosistema de señales** que tiene estructura, dirección e intención. El sistema concibe el espacio público boliviano como un territorio atravesado por flujos informativos que emanan de múltiples fuentes, atraviesan distintos medios y cristalizan en **menciones**: unidades atómicas de presencia mediática.

El ecosistema tiene capas, como una cebolla —de ahí el nombre del motor interno, ONION200. Cada capa transforma la señal: la capa de captura extrae datos crudos; la de indicadores los contextualiza con métricas macroeconómicas; la de procesamiento clasifica, deduplica y enriquece; la de entrega destila la inteligencia en productos consumibles. La realidad no es estática: es un proceso en cuatro fases.

### A.2 Las entidades del universo DECODEX

El sistema reconoce las siguientes entidades como ontológicamente reales:

- **Persona (Actor):** Cualquier individuo con presencia pública relevante —legisladores, ministros, dirigentes, empresarios. La base de datos inicial contiene 173 legisladores del período 2025-2030, pero el modelo no se limita a ellos. Un actor existe en la medida en que los medios lo nombran.

- **Medio (Fuente):** Un canal de publicación que produce o reproduce información. DECODEX reconoce cinco niveles de fuentes: corporativos nacionales (15), regionales (9), alternativos/independientes (6), redes sociales (continuo) y un repositorio extendido de 345 medios registrados ante el TSE. Un medio no es solo un canal: tiene un nivel de confianza, un estado de salud y un rol en la ecología informativa.

- **Mención:** La unidad fundamental de realidad del sistema. Una mención es el registro de que un actor fue nombrado en un medio en un momento determinado. No es la noticia en sí, sino la **huella** de la noticia en el ecosistema. Cada mención puede tener múltiples ejes temáticos (máximo 3), un tipo de tratamiento periodístico, una intención del medio y un conjunto de preguntas fundamentales respondidas.

- **Eje Temático:** Una categoría de clasificación jerárquica (12 raíz + 35 sub-clasificaciones) que organiza la realidad informativa en dimensiones comprensibles. Los ejes no son neutros: reflejan una taxonomía construida deliberadamente para el contexto boliviano, desde Hidrocarburos hasta Relaciones Internacionales.

- **Indicador ONION200:** Un dato macroeconómico o sectorial capturado por vías no mediáticas (APIs, scraping directo de fuentes oficiales) que sirve como contexto de referencia. Tipo de cambio BCB, LME (4 metales), RIN, IPC. Los indicadores no son noticias: son coordenadas objetivas contra las cuales se lee la señal mediática.

- **Producto:** La forma final en que la inteligencia llega al usuario. Un producto no es un reporte genérico: es una entidad tipificada con frecuencia, horario, formato, canal de entrega y protocolo propio.

### A.3 Lo que DECODEX no es

DECODEX no es un medio de comunicación. Esta negación ontológica es fundamental: el sistema no produce noticias, no editorializa, no opina, no juzga. No existe en el mismo plano ontológico que un periódico o un canal de televisión. Existe en el plano de la **observación metamediática**: observa lo que los medios observan.

Tampoco es un sistema de *sentiment analysis*. Esta distinción es tan importante que está codificada en los prompts del sistema como regla inmutable: DECODEX clasifica **tratamiento periodístico**, no sentimiento. El tratamiento es una categoría profesional (informativo, crítico, elogioso, editorial, agresivo), mientras que el sentimiento es una categoría emocional. Para DECODEX, lo relevante es cómo el medio trata al actor, no cómo el actor se siente ni cómo el lector debería sentirse.

### A.4 Hecho vs. rumor vs. señal

El Acta de Nacimiento establece que DECODEX "verifica fuentes, no opiniones" y propone tres preguntas de validación: ¿Enlace vivo? ¿Fuente identificable? ¿Versión cruzada? Esto define un espectro ontológico:

- **Hecho verificado:** Una mención respaldada por al menos una fuente identificable con enlace activo y, de ser posible, versión cruzada en otro medio.
- **Rumor:** Una información no verificable o respaldada por una sola fuente sin corroboración. [PENDIENTE DE DEFINICIÓN: el sistema actualmente no tiene una taxonomía explícita de niveles de veracidad para las menciones individuales.]
- **Señal:** El patrón que emerge de la agregación de múltiples menciones, independientemente de la veracidad de cada una. Una señal es real cuando el patrón es estadísticamente significativo, incluso si las menciones individuales contienen imprecisiones.

---

## B. EPISTEMOLOGÍA — ¿Cómo conoce DECODEX?

### B.1 El axioma fundamental: la fuente como verdad

La epistemología de DECODEX se fundamenta en un axioma simple pero riguroso: **la verdad del sistema es la verdad de la fuente**. El sistema no aspira a una verdad objetiva trascendente; aspira a registrar con fidelidad lo que los medios publicaron. Si un medio dice algo falso, DECODEX registra que el medio dijo eso —no que es falso ni que es verdadero.

Este axioma se codifica en nueve principios inmutables que rigen toda interacción con la IA (extractor-menciones.ts):

1. **Fidelidad al texto fuente:** "Nunca mejorar, suavizar ni reinterpretar el tono original." El texto fuente es sacrosanto. La IA no puede "mejorar" una cita ni "equilibrar" una crítica.
2. **Cero invención:** "Si el texto no responde una pregunta, devolver null." El silencio es preferible a la fabricación. Un dato ausente es un dato ausente, no un dato por descubrir.
3. **Clasificación fiel:** "Si el texto es 100% crítico, clasificar como 100% crítico. No inventar balance." La simetría no es un valor epistémico. Si la realidad mediática es asimétrica, el sistema debe reflejar esa asimetría.
4. **Terminología controlada:** Solo se usan términos de un vocabulario permitido. Los términos prohibidos existen para prevenir la deriva semántica del LLM.
5. **Separar causa de intención:** El "por qué" (causa) y el "para qué" (intención) son preguntas distintas que merecen respuestas independientes.
6. **Contexto boliviano obligatorio:** El sistema debe aplicar conocimiento del contexto político e institucional de Bolivia. No opera en un vacío descontextualizado.
7. **Resumen fiel:** Los resúmenes reflejan la calidad y el tono original, con un máximo de 200 palabras.
8. **Ironía como categoría editorial:** La ironía y el sarcasmo se detectan y clasifican como "tratamiento_editorial", no como un sentimiento ni como informalidad.
9. **Intención y tratamiento como dimensiones independientes:** Una nota puede ser informativa en su intención pero crítica en su tratamiento. El sistema reconoce que un medio puede buscar informar (intención) mientras trata al actor con hostilidad (tratamiento).

### B.2 El método: del dato crudo a la inteligencia accionable

El conocimiento en DECODEX no surge de una operación única, sino de un pipeline de cuatro fases ontológicamente distintas:

**Fase 1 — Captura (extracción):** Se obtiene el texto completo de las notas publicadas por las fuentes monitoreadas. No se capturan fragmentos ni headlines aislados: el texto completo es un requisito para la clasificación fiel. La captura es automatizada mediante scraping, pero la fuente es la decisión arquitectónica D2: "Captura texto completo (uso interno legal)."

**Fase 2 — Triage (filtrado local sin IA):** Antes de que la IA vea una nota, un sistema de keywords locales decide si es relevante. Este diseño obedece a un principio de economía cognitiva y a una preferencia explícita por los falsos positivos sobre los falsos negativos (keyword-triaje.ts): "Es más barato que el LLM clasifique una nota irrelevante a que pierda una relevante." En términos epistemológicos, el sistema prefiere el ruido al silencio: es mejor procesar una nota que no aporta valor que perder una que sí lo hace.

**Fase 3 — Procesamiento (análisis con IA):** La IA (GLM via z-ai-web-dev-sdk) clasifica cada mención relevante en múltiples dimensiones simultáneas: ejes temáticos, tratamiento periodístico, intención del medio, tipo de mención, preguntas fundamentales respondidas. Las reglas anti-alucinación (products.ts) establecen que "solo puedes hacer referencia a las menciones que se te proporcionan en este mensaje. No puedes inventar, deducir, asumir ni rellenar con ningún dato que no esté explícitamente en las menciones proporcionadas." La verificación interna es obligatoria: "Antes de generar el texto final, verifica internamente que cada afirmación está respaldada por al menos una mencion."

**Fase 4 — Entrega (destilación):** Las menciones procesadas se agrupan, comparan y transforman en productos. Aquí opera la regla de la cita obligatoria: "Cada dato, evento o afirmación mencionada en el producto debe ser rastreable a una mención específica de la base de datos. Formato: (Fuente: nombre del medio). Si no puedes citar una mención, no incluyas el dato."

### B.3 El papel de la IA: herramienta, no juez

La inteligencia artificial en DECODEX es un instrumento de clasificación y síntesis, no un agente autónomo de interpretación. El sistema utiliza exclusivamente GLM (via z-ai-web-dev-sdk). La restricción es arquitectónica y filosófica: los modelos occidentales (GPT, Claude, Gemini) están prohibidos por decisión D1. Esta elección no es puramente técnica —refleja una posición sobre la soberanía del procesamiento de datos.

La IA opera dentro de un corset de reglas que limitan su capacidad de interpretación libre. No puede introducir contexto externo no proporcionado en las menciones. No puede hacer análisis prospectivo que no esté basado en tendencias observadas. No puede usar lenguaje político ni emitir juicios de valor. Su función es estrecha: clasificar con fidelidad y sintetizar sin inventar.

Sin embargo, existe una tensión epistemológica. El propio sistema reconoce que el contexto boliviano es obligatorio para la IA (principio 9), pero simultáneamente prohíbe el contexto externo no proporcionado en las menciones (regla anti-alucinación 1). ¿Cuál es la diferencia entre "conocimiento del contexto boliviano" y "contexto externo no proporcionado"? [PENDIENTE DE DEFINICIÓN: la línea entre el conocimiento contextual permitido y la fabricación prohibida necesita mayor precisión operativa.]

### B.4 Deduplicación: la verdad como evento, no como publicación

La deduplicación (deduplicacion.ts) introduce un principio epistemológico importante: el mismo evento publicado por múltiples medios es una sola realidad, no múltiples. El sistema reconoce que en Bolivia "múltiples medios reproducen cables de agencia (ABI, ERBOL, EFE) con ligeras variaciones. Esto es común y NO significa que sean eventos distintos." La verdad del evento no se multiplica por el número de medios que lo reportan.

Cuando el sistema no puede determinar si dos menciones corresponden al mismo evento, el fallback es conservador: se clasifican como eventos distintos. El silencio ante la duda no es neutral: preserva la posibilidad de análisis posteriores. Una mención creada como "original" por error puede ser deduplicada después, pero una mención descartada por error se pierde permanentemente.

### B.5 Indicadores: la verdad objetiva como coordenada

Los indicadores ONION200 (tipo de cambio, LME, RIN, IPC, producción minera) son datos numéricos capturados sin mediación de LLM. Su pipeline es "100% regex" (extractor-menciones.ts). Cumplen una doble función: (1) contexto de referencia para clasificar notas económicas y (2) insumos para generación de productos. En términos epistemológicos, los indicadores son la capa de realidad objetiva contra la cual se evalúa la señal mediática. Si un medio reporta una devaluación, el tipo de cambio BCB permite determinar si esa devaluación es real, exagerada o inventada.

---

## C. AXIOLOGÍA — ¿Qué valores guían el código?

### C.1 Pluralidad de fuentes (sobre neutralidad)

El valor supremo de DECODEX no es la neutralidad —es la **pluralidad de fuentes**. El Acta de Nacimiento lo declara explícitamente: "La imparcialidad no existe. Nuestro compromiso no es con la neutralidad, sino con la pluralidad de fuentes." El sistema reconoce que toda fuente tiene sesgo, que todo medio tiene agenda, que todo periodista tiene perspectiva. La neutralidad absoluta es una ficción; la pluralidad es una práctica medible.

Esta distinción tiene consecuencias operativas: el sistema no busca "equilibrar" la cobertura. Si 10 de 15 medios critican a un actor y 5 lo elogian, el producto refleja esa proporción —no la ajusta a 50/50. La verdad estadística del ecosistema es asimétrica, y el sistema la respeta.

### C.2 Transparencia metodológica

DECODEX no pide que el usuario confíe en él; pide que el usuario verifique. La cita obligatoria en cada producto ("Fuente: nombre del medio") no es un formato, es un principio epistémico: toda afirmación debe ser rastreable. El estándar de productos exige "fuentes citadas con ranking cuantitativo" y "nota metodológica" en cada entrega.

La transparencia también se manifiesta en la arquitectura: las decisiones del sistema están documentadas (CONTEXTO.md, 19 decisiones arquitectónicas), los prompts de IA son inspeccionables, y el código fuente es el propio manual de operación.

### C.3 Fidelidad al texto (sobre la interpretación)

El valor de la fidelidad al texto fuente atraviesa todo el sistema como un principio estructural. No se suavizan las críticas, no se equilibran los elogios, no se "mejora" el tono. La IA está prohibida de reinterpretar lo que los medios publicaron. Este valor se opone radicalmente a la práctica común en sistemas de *sentiment analysis* que "normalizan" o "suavizan" los resultados para presentar dashboards agradables.

### C.4 Soberanía tecnológica

La decisión de utilizar exclusivamente GLM (via z-ai-web-dev-sdk) y prohibir modelos occidentales (GPT, Claude, Gemini) no es una preferencia técnica casual —es una declaración de soberanía sobre el procesamiento de datos mediáticos. Los datos que DECODEX captura son datos sobre Bolivia, para Bolivia. La cadena de procesamiento —desde la captura hasta la entrega— debe ser controlable, auditable e independiente de infraestructuras ajenas.

### C.5 Rigor periodístico sin ser periodistas

El sistema adopta estándares periodísticos (cita de fuentes, verificación de enlaces, distinción entre hecho y opinión) sin ser un medio de comunicación. Los productos siguen una línea base periodística definida en ESTANDAR_PRODUCTOS.md: "Datos reales, no placeholder. Si no hay datos: 'Cobertura limitada para el periodo.'" La regla es de cumplimiento obligatorio: "Todo producto DECODEX debe cumplir este estándar. No hay productos de segunda categoría."

### C.6 Accesibilidad sin simplificación

El sistema aspira a que "un legislador y un estudiante universitario deben poder entender cualquier boletín por igual" (Acta de Nacimiento). Esto implica una ética de comunicación que rechaza tanto la jerga técnica como la simplificación excesiva. "Datos con contexto: '23 menciones' no dice nada; '23 menciones en 6 horas, el triple del promedio diario' sí."

### C.7 Verdad sobre conveniencia

El sistema prioriza la verdad sobre la conveniencia del producto. Si no hay datos suficientes para un producto, se declara explícitamente: "Cobertura limitada para el periodo." No se inventan datos para llenar una plantilla. Un producto con datos escasos pero veraces es preferible a un producto completo pero fabricado.

---

## D. PRAXEOLOGÍA — ¿Cómo actúa DECODEX?

### D.1 Ante la incertidumbre: el silencio sobre la fabricación

Cuando el sistema no tiene información suficiente, su acción por defecto es el silencio (null) o la declaración explícita de limitación. La IA devuelve null cuando el texto no responde una pregunta. Los productos declaran "cobertura limitada" cuando no hay suficientes menciones. La deduplicación crea menciones originales cuando no puede confirmar duplicidad. En todos los casos, el principio es el mismo: es mejor admitir ignorancia que fabricar conocimiento.

### D.2 Ante el sesgo: el reconocimiento, no la corrección

DECODEX no corrige los sesgos de los medios —los registra. Si un medio trata a un actor con hostilidad, el sistema clasifica ese tratamiento como "agresivo", pero no lo modifica ni lo compensa con fuentes favorables. El mapa debe reflejar el territorio tal cual es, incluyendo sus deformaciones.

Sin embargo, la pluralidad de fuentes opera como un mecanismo correctivo implícito: al monitorear 30+ fuentes de 5 niveles distintos (nacionales, regionales, alternativos, redes sociales, repositorio extendido), el sistema genera una imagen compuesta que naturalmente compensa los sesgos individuales de cada fuente. La corrección del sesgo no es una acción del sistema, sino una propiedad emergente del método.

### D.3 Ante la alucinación: la prevención por diseño

Las 7 reglas anti-alucinación de products.ts constituyen el protocolo defensivo más explícito del sistema. Cada regla es una acción preventiva:

- **Restricción de fuentes:** Solo menciones proporcionadas. Cero datos externos.
- **Personajes públicos:** Solo si aparecen explícitamente nombrados. Cero asociaciones inventadas.
- **Cita obligatoria:** Cada dato rastreable. Formato: (Fuente: nombre del medio).
- **Neutralidad de lenguaje:** Cero lenguaje político, de opinión o de juicio de valor.
- **Metadatos prohibidos:** Cero información interna del sistema en productos.
- **Idioma boliviano:** Todo el contenido en español boliviano.
- **Verificación interna:** Cada afirmación respaldada por al menos una mención antes de generar.

Estas reglas no son recomendaciones —son "de cumplimiento OBLIGATORIO" y se inyectan "al INICIO de cada system prompt."

### D.4 Ante la urgencia: la tensión como categoría operativa

El ESTANDAR_PRODUCTOS.md define tres niveles de tensión que traducen la incertidumbre en acción:

- **ALTA** (rojo): Afecta políticas públicas o derechos humanos, múltiples fuentes, potencial de escalamiento.
- **MEDIA** (ámbar): Tema recurrente con desarrollo nuevo, 2-3 fuentes.
- **BAJA** (verde): Informativo sin tensión inmediata, 1 fuente.

La tensión no es una emoción ni un sentimiento —es una categoría de acción. Una tensión alta requiere atención inmediata; una baja puede esperar. El sistema transforma la complejidad de la realidad en una escala operativa que orienta la decisión del usuario.

### D.5 Ante la ética de publicación: el mapa, no el territorio

La frase fundacional —"Entregamos el mapa, no el territorio"— es el principio rector de toda acción de publicación. DECODEX no le dice al usuario qué pensar; le muestra qué existe, en qué proporción, con qué tratamiento, en qué fuentes, en qué contexto. El usuario saca sus propias conclusiones.

Esto tiene una implicación ética profunda: el sistema no puede ser cómplice de una narrativa que no existe en los datos. Si los medios no cubren un tema, el producto no lo inventa. Si un actor no tiene menciones, no aparece. La ausencia en el mapa es tan informativa como la presencia.

### D.6 Ante el error: el falso positivo como virtud

El sistema de triaje por keywords establece explícitamente que "prefiere falso positivo sobre falso negativo." Esta es una decisión ética de diseño: es preferible que el sistema procese información innecesaria a que pierda información relevante. En un ecosistema mediático donde la información es poder, la omisión es el error más grave.

### D.7 Ante el contexto boliviano: el conocimiento local como requisito

DECODEX no es un sistema genérico de media monitoring adaptado a Bolivia —es un sistema diseñado desde Bolivia para Bolivia. La Constitución Política del Estado (CPE 2009) es explícitamente mencionada como marco operativo. El conocimiento del contexto político e institucional boliviano es un principio obligatorio para la IA. Los ejes temáticos están diseñados para la realidad boliviana: desde Hidrocarburos hasta Movimientos Sociales, desde la COB hasta el TSE.

### D.8 Ante la verdad histórica: Evidencia Forense Bajo Demanda

DECODEX opera bajo el principio de **"Blindaje Histórico"**: cada mención procesada es capturada en su estado original (HTML estático o imagen) y sellada criptográficamente (SHA-256) en el momento de su ingesta. Este principio responde a una realidad del ecosistema mediático boliviano: las notas digitales pueden ser modificadas, corregidas o eliminadas por sus medios de origen sin dejar rastro público. Sin evidencia forense, la mención registrada por DECODEX podría convertirse en una afirmación no verificable.

**Almacenamiento Universal:** El sistema guarda la evidencia de TODAS las menciones, independientemente del nivel del usuario. Esto garantiza que la verdad histórica esté preservada incluso si el medio original modifica o borra la nota. El almacenamiento no es un privilegio comercial —es una obligación epistémica. La evidencia existe porque la verdad existe, no porque alguien pague por ella.

**Acceso Diferenciado:** El acceso a la evidencia sigue el modelo de acceso diferenciado del ecosistema:

- *Niveles Básico/Profesional:* Acceden a metadatos textuales en los reportes estándar (Fuente, Fecha, URL, tratamiento periodístico). Estos metadatos son suficientes para la mayoría de los usos operativos.
- *Nivel Premium:* Tiene derecho a solicitar la "Evidencia Forense Digital" (archivo original + hash SHA-256 + timestamp de captura) bajo demanda. Esta capa adicional de verificación está diseñada para contextos donde la prueba documental es requerida: procesos legales, auditorías, verificación independiente.

**No Exposición Automática:** La evidencia cruda (HTML, captura de pantalla) nunca se incluye en boletines, reportes automáticos ni productos del sistema. Los productos DECODEX mantienen su naturaleza sintética y analítica: entregan mapas, no archivos brutos. La evidencia se entrega únicamente mediante solicitud expresa vía API segura, generando una URL firmada de corta duración (5 minutos). Este diseño preserva la ligereza de los productos y evita la exposición accidental de contenido archivado.

**Integridad Criptográfica:** El hash SHA-256 permite al usuario verificar de forma independiente que el archivo entregado no ha sido alterado desde su captura. El flujo es: el usuario recibe el archivo + el hash almacenado → calcula el hash local del archivo recibido → compara ambos valores → si coinciden, la evidencia es íntegra. DECODEX no pide confianza —proporciona verificabilidad.

Este principio extiende el axioma fundamental de "la fuente es la verdad" al dominio temporal: no basta con registrar qué dijo la fuente —es necesario preservar la prueba de que lo dijo, tal como lo dijo, en el momento en que lo dijo. La verdad sin evidencia es una afirmación; la verdad con evidencia es un hecho demostrable.

---

## CONTRADICCIONES IDENTIFICADAS

| # | Contradicción | Fuente A | Fuente B | Marca |
|---|---|---|---|---|
| 1 | "Sentimiento" vs. "Tratamiento periodístico" | strategy.ts menciona "sentimiento público" como componente del producto | Acta de Nacimiento y extractor-menciones.ts prohíben el término "sentimiento" | [PENDIENTE DE DEFINICIÓN] |
| 2 | "Contexto externo permitido" vs. "Contexto externo prohibido" | extractor-menciones.ts exige "contexto boliviano" | products.ts prohíbe "contexto externo no proporcionado en las menciones" | [PENDIENTE DE DEFINICIÓN] |
| 3 | "Neutralidad" como posición vs. "La imparcialidad no existe" | ESTANDAR_PRODUCTOS.md exige "neutralidad en la etiqueta" | Acta de Nacimiento declara que "la imparcialidad no existe" | [PENDIENTE DE DEFINICIÓN] |
| 4 | Postgresql (prod) vs. SQLite (dev) documentado como destino final | Acta de Nacimiento menciona PostgreSQL para producción | El código usa SQLite como base de datos operativa | [PENDIENTE DE DEFINICIÓN — probablemente resuelto por fase de deploy] |

---

## PRINCIPIOS INMUTABLES (RESUMEN)

Estos son los principios que no pueden ser modificados sin una revisión formal de este manifiesto:

1. **No somos jueces ni parte.** Reflejamos la realidad mediática, no la evaluamos.
2. **La fuente es la verdad.** Si la fuente lo dijo, el sistema lo registra. Si no lo dijo, el sistema no lo inventa.
3. **Fidelidad al texto.** Nunca mejorar, suavizar, reinterpretar ni equilibrar lo que los medios publicaron.
4. **Pluralidad sobre neutralidad.** El compromiso es con la diversidad de fuentes, no con la ilusión de imparcialidad.
5. **El mapa, no el territorio.** El sistema entrega información para que el usuario decida.
6. **Cita obligatoria.** Toda afirmación es rastreable a una fuente específica.
7. **Silencio sobre fabricación.** Cuando no hay datos, se declara limitación. Nunca se inventa.
8. **Tratamiento, no sentimiento.** El sistema clasifica postura editorial, no emociones.
9. **Soberanía tecnológica.** Solo GLM. Datos de Bolivia, procesados bajo control boliviano.
10. **Falso positivo sobre falso negativo.** Es mejor procesar ruido que perder señal.
11. **Verdad histórica blindada.** Toda mención es capturada y sellada criptográficamente en el momento de ingesta. La evidencia se almacena siempre; el acceso a la evidencia cruda es bajo demanda y exclusivo para usuarios Premium.

---

*Este documento constituye la referencia filosófica definitiva del ecosistema DECODEX. Cualquier agente (humano o artificial) que opere dentro del sistema debe alinearse con estos principios. Las contradicciones marcadas como [PENDIENTE DE DEFINICIÓN] requieren resolución por el equipo directivo antes de que el sistema entre en producción.*

*Documento generado a partir del análisis de: Acta de Nacimiento v2.0, CONTEXTO.md, ESTANDAR_PRODUCTOS.md, README.md, extractor-menciones.ts, products.ts, strategy.ts, deduplicacion.ts, keyword-triaje.ts.*
