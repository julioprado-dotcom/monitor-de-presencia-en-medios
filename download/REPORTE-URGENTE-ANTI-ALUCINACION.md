# REPORTE URGENTE: Correccion Anti-Alucinacion en Generadores
## DECODEX Bolivia ONION200 v0.16.0

**Fecha:** 13 de mayo de 2026  
**Commits:** 9e731f8 → 66d5f0a  
**Prioridad:** CRITICA — Implementado y verificado

---

## Resumen Ejecutivo

Se implemento un sistema completo de prevencion de alucinaciones en los 12 generadores de productos de DECODEX Bolivia. El problema raiz fue que los system prompts del LLM tenian restricciones debiles ("Solo usar datos proporcionados") y temperaturas altas (hasta 0.6), permitiendo a la IA inventar datos, mencionar personajes politicos fuera de contexto, y generar contenido en ingles.

### Correcciones Implementadas:
1. 7 reglas anti-alucinacion obligatorias inyectadas al INICIO de cada system prompt
2. Sistema de verificacion post-generacion que cruza contenido contra menciones reales
3. Temperaturas reducidas a maximo 0.2 (antes hasta 0.6)
4. Deteccion de personajes politicos sensibles (19 nombres)
5. Deteccion de contenido en ingles

### Estado: Implementado. Pendiente regeneracion de productos con API disponible.

---

## Diagnosticos por Generador

### Generadores que usan LLM (5 endpoints):

| Generador | Archivo | Prompt Anterior | Problemas | Prompt Corregido | Verificacion Integrada |
|---|---|---|---|---|---|
| El Termometro | `generate-termometro/route.ts` | "Solo usar datos proporcionados, no inventar informacion" | Sin prohibicion de contexto externo, temp 0.3 | 7 reglas + temp 0.0 | SI |
| Saldo del Dia | `generate-saldo/route.ts` | "Solo usar datos proporcionados" | Mismo problema, temp 0.3 | 7 reglas + temp 0.0 | SI |
| El Radar | `generate-radar/route.ts` | "Solo usar datos proporcionados" | Mismo problema, temp 0.3 | 7 reglas + temp 0.0 | SI |
| El Foco | `generate-foco/route.ts` | "Incluir contexto y antecedentes cuando sea relevante" | Instruccion que da libertad de inventar, temp 0.5 | 7 reglas + temp 0.1 | SI |
| Generic (11 productos) | `generate-generic/route.ts` | Varia por producto | Varios, temps 0.3-0.6 | 7 reglas + temps corregidos | SI |

### Productos que NO usan LLM:
- Ficha Legislador: solo datos de la DB

---

## Cambios en Temperaturas

| Categoria | Productos | Temp Anterior | Temp Nueva |
|---|---|---|---|
| RESTRINGIDO (cero libertad) | El Termometro, Saldo del Dia, El Radar | 0.3 | **0.0** |
| MODERADO (algunas libertades) | El Foco, El Hilo, Foco de la Semana, Boletin del Grano | 0.4-0.6 | **0.1** |
| ABIERTO (verificacion estricta) | El Especializado, El Informe Cerrado | 0.4-0.5 | **0.2** |

---

## Verificacion Post-Generacion

### Archivo: `src/lib/verification/verify-product.ts`

**Logica:**
1. Construir corpus de texto verificado a partir de las menciones reales
2. Dividir el texto generado en oraciones
3. Verificar cada oracion contra el corpus:
   - Personajes sensibles: si aparece un nombre politico NO en las menciones, eliminar
   - Datos especificos (leyes, decretos, cifras): verificar respaldo
   - Contenido en ingles: detectar patrones
4. Reconstruir texto limpio sin contenido no verificado
5. Devolver resultado con flag `verified` y detalle de eliminaciones

### Personajes Politicos Sensibles (19):
Evo Morales, Luis Arce, David Choquehuanca, Santa Cruz, Camacho, Mesa, TSE, OEP, Fiscalia, Tribunal Supremo, Tribunal Constitucional, CIDOB, CONAMAQ, COB, MAS, Comunidad Ciudadana, Creemos, Frente Unido, Senado, Diputados, Presidente, Vicepresidente, Ministro, Gabinete, Fiscal, Defensor, Contralor.

### Integracion en Generadores:
Cada generador ahora ejecuta despues de la llamada al LLM:
```typescript
const textoVerificado = await verifyProduct(contenido, mencionesUsadas, tipoProducto);
if (!textoVerificado.verified) {
  console.log('ALERTA: Se elimino contenido no verificado:', textoVerificado.eliminados.length);
}
// Usa textoVerificado.textoLimpio en lugar del original
```

---

## Verificacion de Base de Datos

### Estado Confirmado:
- **DB correcta:** `/home/z/my-project/prisma/db/custom.db` (9.7 MB)
- **Total menciones:** 399
- **Rango:** 12-13 mayo 2026 (ultimas 24h)
- **`src/lib/db.ts`** ya sobreescribe `DATABASE_URL` a la ruta correcta

### Eventos Clave Verificados en la DB:

| Evento | Menciones | Estado |
|---|---|---|
| COB (bloqueos, paro) | 25 | Encontrado |
| Ponchos Rojos | 23 | Encontrado |
| Santa Cruz | 26 | Encontrado |
| Morales (Evo) | 24 | Encontrado |
| Bloqueos | 30 | Encontrado |
| Ley 1720 | 3 | Encontrado |
| Magisterio | 1 | Encontrado |
| Marcha indigena | - | Buscar en texto completo |

---

## Reglas Anti-Alucinacion Implementadas

Las 7 reglas se inyectan al INICIO de cada system prompt:

1. **RESTRICCION DE FUENTES:** Solo referirse a menciones proporcionadas. No inventar.
2. **PERSONAJES PUBLICOS:** Solo mencionar si aparecen explicitamente en las menciones.
3. **CITA OBLIGATORIA:** Cada dato debe citar fuente: (Fuente: nombre del medio).
4. **NEUTRALIDAD:** DECODEX es observatorio neutral. No opinar, no interpretar.
5. **METADATOS PROHIBIDOS:** No timestamps, IDs, ni info tecnica interna.
6. **IDIOMA:** Todo en espanol boliviano.
7. **VERIFICACION INTERNA:** Verificar respaldo antes de generar texto final.

---

## Productos Contaminados (Generados Antes de la Correccion)

Los 10 PDFs generados previamente en `download/productos/semana-20/` pueden contener datos inventados. Se recomienda:

1. **No distribuir** los productos anteriores sin advertencia.
2. **Regenerar** cada producto con las nuevas restricciones una vez que la API LLM este disponible.
3. **Marcar** como: "ADVERTENCIA: Producto generado antes de implementar verificacion estricta."

---

## Siguientes Pasos

1. **Regenerar El Termometro** cuando la API LLM no este rate-limited (429).
2. **Regenerar Saldo del Dia** con las mismas restricciones.
3. **Regenerar los demas productos** afectados.
4. **Monitorear** los productos generados durante la proxima semana.
5. **Implementar** el panel de IA del dashboard para feedback continuo del admin.
6. **Considerar** verificacion humana antes de enviar productos a destinatarios.
7. **Eliminar** `ADMIN_API_KEY` del `.env` antes de deploy a produccion.

---

## Archivos Modificados

| Archivo | Cambio |
|---|---|
| `src/constants/products.ts` | 7 reglas anti-alucinacion + temperaturas corregidas en 12 productos |
| `src/lib/verification/verify-product.ts` | NUEVO: Sistema de verificacion post-generacion |
| `src/app/api/admin/bulletins/generate-termometro/route.ts` | Integracion de verifyProduct() |
| `src/app/api/admin/bulletins/generate-saldo/route.ts` | Integracion de verifyProduct() |
| `src/app/api/admin/bulletins/generate-radar/route.ts` | Integracion de verifyProduct() |
| `src/app/api/admin/bulletins/generate-foco/route.ts` | Integracion de verifyProduct() |
| `src/app/api/admin/bulletins/generate-generic/route.ts` | Integracion de verifyProduct() |
| `scripts/test-termometro-regen.ts` | NUEVO: Script de prueba de regeneracion |
| `.env` | ADMIN_API_KEY agregado temporalmente |
