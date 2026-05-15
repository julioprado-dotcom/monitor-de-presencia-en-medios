# REPORTE — BOLETÍN DEL GRANO
## Implementación del Producto

**Fecha:** 2026-05-13  
**Agente:** ONION200 v0.16.0  
**Estado:** Implementación completa (PASO 1-6)

---

## 1. Estado del Producto

| Componente | Estado | Detalle |
|---|---|---|
| TipoBoletin | Registrado | `BOLETIN_DEL_GRANO` agregado al union type |
| PRODUCTOS config | Registrado | Config completa con system prompt, 1800 palabras objetivo, temperatura 0.4 |
| BOLETINES_SCHEDULE | Registrado | Lunes 08:00 AM, prioridad 5, Lun-Vie |
| ETIQUETAS_ENTREGA | Registrado | WhatsApp + Email con placeholders {semana}, {inicio}, {fin} |
| Lente 9 DECODEX | Verificado | `cafe-economicas-regionales` existe (resultado Ejes V2) |
| Keywords | 196 registradas | 22 pre-existentes + 174 nuevas agregadas |
| Fuentes | 46 medios | 33 pre-existentes + 13 nuevas especializadas |
| Generador PDF | Creado | `boletin-del-grano.ts` — 9 secciones, paleta cafetera |
| API Route | Creada | `POST /api/admin/bulletins/generate-boletin-grano` |
| Clasificador | Keyword-based | 7 ejes internos con densidad de keywords |
| Modo prueba | Funcional | `modoPrueba=true` genera con datos de ejemplo |

---

## 2. Estructura del Producto

### 9 Secciones del PDF

| # | Sección | Contenido |
|---|---|---|
| 1 | PORTADA | Marca DECODEX, título, período, semana, versión, tensión general |
| 2 | RESUMEN EJECUTIVO | 2-3 párrafos narrativos con hallazgos de la semana |
| 3 | ESTADÍSTICAS CLAVE | 6 cards: total noticias, fuentes, ejes, actividad, C-market, variación |
| 4 | MAPA DE TENSIONES | Tabla con 7 ejes internos: cobertura %, noticias, tendencia |
| 5 | NOTICIAS DESTACADAS | 3-5 noticias con tensión badge, resumen, ejes, fuentes |
| 6 | ÍNDICE DE FUENTES | Ranking de fuentes con conteo y badge "NUEVA" |
| 7 | CRUCE TRANSVERSAL | Análisis cruzado entre ejes y temas |
| 8 | TENDENCIA Y PROYECCIÓN | Tendencia cualitativa + alertas a monitorear |
| 9 | NOTA METODOOLÓGICA | Fuentes, período, keywords, criterios |

### Paleta de Colores

| Color | Hex | Uso |
|---|---|---|
| Header | `#3e2723` | Portada, cabeceras |
| Accent | `#6d4c41` | Acentos, líneas, badges |
| Accent2 | `#4e342e` | Grano de café, destacados |
| Border | `#bcaaa4` | Bordes de tablas |
| Background | `#faf6f1` | Fondo general crema |
| Tensión ALTA | `#c62828` | Rojo |
| Tensión MEDIA | `#ef6c00` | Naranja |
| Tensión BAJA | `#2e7d32` | Verde |

---

## 3. Keywords Registradas (196 total)

### Distribución por Eje Interno

| Eje | Keywords代表性的 |
|---|---|
| Mercado y Precios | precio café, C-market, ICE, arábica, robusta, FOB, bolsa, coffee price |
| Clima y Producción | helada café, roya del cafeto, broca, cosecha, floración, Yungas, Caranavi |
| Política y Regulación | SENASAG, EUDR, FDA, IBCE, normativa, arancel, certificación |
| Logística y Exportación | flete café, puerto Arica, contenedor, logística, ruta exportación |
| Innovación y Técnica | procesamiento, honey, anaeróbico, torrefacción, SCA, Geisha, Pacamara |
| Ferias y Oportunidades | SCA Expo, Cup of Excellence, concurso, capacitación, USAID |
| Cadena y Contexto | CENAPROC, COAINE, COABOL, productor, cafetería, consumo interno |

### Cobertura Idiomática
- Español (alta prioridad): ~44 términos
- Inglés (media prioridad): ~26 términos
- Compuestas (baja prioridad): ~10 frases
- Específicos por eje: ~94 términos
- Generales: ~22 términos

---

## 4. Fuentes Registradas (46 total)

### Fuentes Nacionales (ya existentes): 33
Incluyen: El Deber, Los Tiempos, Página Siete (nueva), El Diario, Opinión, ERBOL (nueva), ABI, Bolivia TV, ANF, etc.

### Fuentes Sectoriales (nuevas): 7
- IBCE (comercio exterior)
- SENASAG (certificaciones)
- OIC Café (precios globales)
- SCA (especialidad)
- Perfect Daily Grind (medio líder)
- Coffee Review (reseñas)
- Minuta de Café (regional)

### Fuentes de Mercado (nuevas): 3
- Investing.com Café
- TradingView Café
- Reuters Commodities

---

## 5. Prueba de Generación (PASO 6)

### Resultado
- HTML generado: **25,643 bytes** (732 líneas)
- 9 secciones completas
- 4 noticias de ejemplo con tensiones ALTA (2) y MEDIA (2)
- 5/7 ejes activados
- Paleta cafetera aplicada correctamente
- PDF: modo mock (Puppeteer no disponible en sandbox)

### Archivos Generados
- `/download/boletin-del-grano-semana-19.html` — HTML completo
- PDF: se generará en producción cuando Puppeteer esté disponible

### Verificaciones Pasadas
- TypeScript compila sin errores en archivos modificados
- `getProductConfig('BOLETIN_DEL_GRANO')` retorna config válida
- `getDateRange('BOLETIN_DEL_GRANO')` retorna rango semanal correcto
- Clasificación keyword-based funciona en modo prueba

---

## 6. API Endpoints

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/admin/bulletins/generate-boletin-grano` | POST | Genera el boletín con datos reales o prueba |

### Payload
```json
{
  "modoPrueba": true
}
```

### Response
```json
{
  "success": true,
  "reporteId": "...",
  "semana": 19,
  "totalNoticias": 4,
  "tensionGeneral": "ALTA",
  "ejesActivados": 5,
  "pdfGenerado": true,
  "coberturaLimitada": false
}
```

---

## 7. Commits Realizados

| Commit | Descripción |
|---|---|
| `d283052` | PASO 2: Producto BOLETIN_DEL_GRANO registrado |
| `b359219` | PASO 3: 174 keywords agregadas a Lente 9 |
| `6f86967` | PASO 4: 13 fuentes registradas |
| `db36c86` | PASO 5: Generador PDF + API route |
| `456031a` | PASO 6: Prueba de generación |

---

## 8. Problemas Encontrados

1. **Puppeteer no disponible en sandbox**: El PDF se genera en modo mock (HTML completo sin conversión). En producción con Puppeteer instalado, el PDF se generará correctamente.

2. **Datos de café limitados**: Con solo 175 menciones totales (1 día de datos), es probable que el boletín requiera `modoPrueba=true` inicialmente hasta que el scraper capture suficientes noticias de café.

3. **Clasificación keyword-based limitada**: El clasificador actual usa matching literal de keywords. Para mejor precisión, se recomienda integrar con el clasificador LLM existente (extractor-menciones.ts) que ya entiende contexto semántico.

---

## 9. Próximos Pasos

1. **Integrar con pipeline de scrape**: Configurar check-fuente para las 13 fuentes nuevas (sectoriales + mercado)
2. **Ampliar keywords**: Agregar variaciones y sinónimos según las menciones capturadas
3. **Clasificador LLM**: Modificar extractor-menciones.ts para que reconozca los 7 ejes internos del boletín
4. **Scheduler**: Verificar que el BOLETINES_SCHEDULE ejecute correctamente los lunes
5. **Puppeteer en producción**: Instalar Puppeteer para generación real de PDFs
6. **UI Dashboard**: Agregar widget de estado del Boletín del Grano en el dashboard
7. **Suscriptores**: Configurar distribución a la asociación cafetera (email + WhatsApp)
8. **Indicadores**: Crear indicador para precio C-market y registrarlo en la tabla Indicador
