# APÉNDICE TÉCNICO A: MATRICES DE RIESGO Y REGLAS DE ALERTA TEMPRANA

**Versión:** 1.0 — 15 de mayo de 2026  
**Clasificación:** Interno — Operativo  
**Objetivo:** Transformar datos en señales de alerta accionables (semáforo 🟢🟡🔴) para productos automatizados.

---

## 1. MATRIZ DE INDICADORES POR EJE ESTRATÉGICO

### Eje 1: Macroeconomía, Divisas y Finanzas Públicas

| Indicador | Fuente | Frecuencia | Umbral 🟡 (Precaución) | Umbral 🔴 (Alerta) |
|-----------|--------|------------|------------------------|--------------------|
| **Brecha Dólar (Paralelo vs Oficial)** | Dólar Blue Bolivia, Prensa | Diario | Brecha > 10% | Brecha > 15% o sube >2% en un día |
| **Reservas Internacionales (RIN)** | BCB (comunicados) | Semanal | Caída acumulada >50 MM USD en semana | Caída >100 MM en un mes |
| **Volatilidad Minera (Zn, Sn)** | LME, Investing.com | Diario | Bajada 2-5% en 3 días | Bajada >5% en 1 día o >10% semanal |
| **Precio Litio (Carbonato)** | Fastmarkets, Trading Econ. | Diario | Bajada 3-6% en 3 días | Bajada >6% en 1 día |
| **Emisión Monetaria / Déficit** | MEFP, Prensa | Mensual | Déficit proyectado >6% PIB | Anuncio de emisión monetaria directa |

### Eje 2: Social, Laboral y Conflictividad

| Indicador | Fuente | Frecuencia | Umbral 🟡 (Precaución) | Umbral 🔴 (Alerta) |
|-----------|--------|------------|------------------------|--------------------|
| **Bloqueos Activos** | ABC, Prensa | Diario | 1 bloqueo departamental | Bloqueo ruta internacional (Chile/Perú) o ciudad eje |
| **Días de Paro Sectorial** | ERBOL, ANF | Diario | Paro de 24h en un sector | Paro indefinido en 2+ sectores |
| **Violencia en Zona Minera** | Policía, Prensa | Diario | Múltiples eventos en zona minera | Toque de queda o estado de excepción |
| **Movilizaciones Anunciadas** | Redes, Prensa | 48h Previas | Marcha departamental | Marcha nacional convocada (COB, Cívicos) |

### Eje 3: Energía e Hidrocarburos

| Indicador | Fuente | Frecuencia | Umbral 🟡 (Precaución) | Umbral 🔴 (Alerta) |
|-----------|--------|------------|------------------------|--------------------|
| **Producción Gas Natural** | ANH, YPFB | Diario | < 36 MMm³/d | < 33 MMm³/d o caída >5% mensual |
| **Desabastecimiento Combustible** | ANH, Gremios | Diario | Filas >2 km en una capital | Racionamiento o suspensión de ventas |
| **Cortes Electricidad Programados** | ENDE, COES | Diario | Aviso de déficit por sequía | Cortes rotativos >4h en zona industrial |
| **Precio Spot Gas Exportación** | YPFB, Prensa | Trimestral | Baja >10% trimestral | Activación cláusula renegociación |

### Eje 4: Político-Institucional y Gobernanza

| Indicador | Fuente | Frecuencia | Umbral 🟡 (Precaución) | Umbral 🔴 (Alerta) |
|-----------|--------|------------|------------------------|--------------------|
| **Renuncias Alto Nivel** | Prensa Nacional | Continuo | Renuncia en áreas clave (Economía, Minería) | Renuncia Ministro Economía o Hidrocarburos |
| **Inhabilitaciones Judiciales** | TCP, Prensa | Continuo | Inhabilitación gobernador/alcalde | Inhabilitación precandidato presidencial |
| **Casos Corrupción Alto Perfil** | FGE, Prensa | Continuo | Denuncia con allanamientos | Imputación formal autoridad electa |
| **Decretos de Impacto Sectorial** | Gaceta Oficial | Continuo | Decreto genera rechazo gremial | Decreto provoca paro inmediato |

### Eje 5: Infraestructura y Logística

| Indicador | Fuente | Frecuencia | Umbral 🟡 (Precaución) | Umbral 🔴 (Alerta) |
|-----------|--------|------------|------------------------|--------------------|
| **Tiempo Paso a Puertos** | Exportadores, Prensa | Diario | 3-4 días | >5 días o cierre de frontera |
| **Estado Rutas Críticas** | ABC, ERBOL | Diario | Bloqueo 4-6 horas | Bloqueo >12 horas o toma de peajes |
| **Costo Flete por Tonelada-km** | Cámara Transporte | Semanal | Sube 10-20% | Sube >20% con desabastecimiento |

### Eje 6: Ambiental, Climático y Recursos Hídricos

| Indicador | Fuente | Frecuencia | Umbral 🟡 (Precaución) | Umbral 🔴 (Alerta) |
|-----------|--------|------------|------------------------|--------------------|
| **Déficit Hídrico (Lagos/Ríos)** | SENAMHI, Satélites | Mensual | Déficit 10-20% vs promedio | Déficit >20% o caudal seco |
| **Incendios Forestales (Focos)** | NASA FIRMS, Prensa | Diario | 200-500 focos activos | >500 focos o cerca de ciudades/áreas protegidas |
| **Calidad del Aire (PM2.5)** | Red MÓNICA, UMSA | Diario | 50-100 µg/m³ | >100 µg/m³ (dañino) |
| **Incidente Presas de Relaves** | COMIBOL, Prensa | Continuo | Filtración menor | Rotura con afectación de río/comunidad |

---

## 2. MATRIZ DE CRUCES SECTORIALES (RIESGOS SISTÉMICOS)

Estos cruces activan alertas compuestas cuando dos ejes presentan problemas simultáneos.

| Cruce | Por qué es crítico | Indicador Compuesto de Ejemplo | Acción Automática |
|-------|-------------------|-------------------------------|-------------------|
| **Economía ↔ Energía** | Caída gas = menos divisas = menos diésel = paro minero/agro. | Elasticidad producción gas vs. recaudación regalías mineras. | Alerta "Crisis de Balanza Comercial" |
| **Social ↔ Política** | Huelgas generales preceden cambios de gabinete o adelanto electoral. | Días de paro por mes vs. variación aprobación presidencial. | Alerta "Inestabilidad de Gabinete" |
| **Energía ↔ Logística** | Desabastecimiento diésel encarece alimentos y minerales. | Precio diésel vs. costo flete tonelada-km. | Alerta "Inflación de Costos Logísticos" |
| **Ambiente ↔ Minería** | Escasez agua en salares afecta litio y concentrado de zinc. | Litros agua/TMF frente a precipitaciones en Lípez. | Alerta "Riesgo Operativo Minero" |
| **Infraestructura ↔ Comercio** | Bloqueos en El Alto detienen exportaciones a Chile/Perú. | Días cierre frontera vs. valor exportaciones no recuperadas. | Alerta "Colapso de Exportaciones" |
| **Macro ↔ Política** | Déficit fiscal + emisión = expectativas devaluación + fuga capitales. | Diferencial Dólar oficial/paralelo vs. riesgo país implícito. | Alerta "Crisis Cambiaria Inminente" |

---

## 3. ALGORITMO DE SEMÁFORO Y CONSOLIDACIÓN

### 3.1 Reglas de Estado por Eje

El estado de cada eje se calcula diariamente a las 08:00 AM:

- **🟢 VERDE (Estable):** Ningún indicador supera umbral 🟡.
- **🟡 AMARILLO (Precaución):** 
  - 1 indicador en 🔴 **O**
  - 2+ indicadores en 🟡.
- **🔴 ROJO (Alerta):** 
  - 2+ indicadores en 🔴 **O**
  - 1 indicador en 🔴 + 2+ en 🟡 **O**
  - Activación de cruce sistémico crítico.

### 3.2 Formato de Salida (JSON para Productos)

```json
{
  "fecha": "2026-05-15",
  "hora_actualizacion": "08:00:00",
  "estado_global": "AMARILLO",
  "ejes": {
    "macroeconomia": {
      "estado": "ROJO",
      "indicadores_alerta": ["brecha_dolar", "rin"],
      "descripcion": "Presión cambiaria crítica con caída de reservas."
    },
    "social": {
      "estado": "AMARILLO",
      "indicadores_alerta": ["bloqueos_oruro"],
      "descripcion": "Bloqueo en ruta estratégica pero sin paro nacional."
    },
    "energia": { "estado": "VERDE", "indicadores_alerta": [], "descripcion": "Operatividad normal." },
    "politica": { "estado": "VERDE", "indicadores_alerta": [], "descripcion": "Sin novedades relevantes." },
    "infraestructura": { "estado": "VERDE", "indicadores_alerta": [], "descripcion": "Rutas fluidas." },
    "ambiente": { "estado": "AMARILLO", "indicadores_alerta": ["incendios_chiquitania"], "descripcion": "Aumento de focos en región este." }
  },
  "cruces_activos": [
    {
      "tipo": "macro_politica",
      "nivel": "alto",
      "mensaje": "La presión cambiaria podría desencadenar medidas políticas impopulares."
    }
  ],
  "recomendacion_accion": "Monitorear tipo de cambio paralelo y preparar informe especial sobre impacto en importaciones."
}
```

---

## 4. PROTOCOLO DE ACTUALIZACIÓN DE UMBRALES

Los umbrales no son estáticos. Se revisarán trimestralmente bajo estos criterios:

1. **Cambio Estructural:** Si un indicador permanece en 🟡 o 🔴 por más de 3 meses consecutivos, se recalibra el umbral al nuevo promedio histórico (ventana móvil 90 días).
2. **Falsa Alarma:** Si un indicador activa 🔴 pero no genera impacto real en 3 ocasiones consecutivas, se ajusta el umbral (+/- 5%).
3. **Nuevas Fuentes:** Si aparece una fuente de mayor frecuencia o precisión (ej. API en tiempo real), se migra el indicador y se redefinen umbrales con datos históricos de la nueva fuente.

---

## 5. PASOS PARA IMPLEMENTACIÓN INMEDIATA

1. **Crear Tabla en Base de Datos:** `DailyIndicators` con campos: `date`, `axis`, `indicator_name`, `value`, `status` (GREEN/YELLOW/RED).
2. **Script de Ingesta Diaria:** Automatizar la lectura de fuentes (APIs, scraping ligero) para llenar la tabla antes de las 08:00 AM.
3. **Motor de Reglas:** Función `calculateStatus()` que aplique las reglas de la sección 3.1.
4. **Endpoint Público:** `GET /api/alerts/daily` que retorne el JSON de la sección 3.2.
5. **Integración en Productos:** 
   - **Boletín Semanal:** Incluir sección "Semáforo de Riesgos".
   - **Dashboard:** Visualizar matriz de cruces en tiempo real.
   - **Alertas Push:** Enviar notificación Telegram/Email solo si `estado_global == ROJO` o cambia de estado.

---

*Documento complementario al Manifiesto Epistemológico DECODEX v1.0.*
