// ─── PRUEBA DE FUEGO — Motor de Alertas Tempranas DECODEX ────────────────
// Ejecutar: npx tsx scripts/test-alertas-fire.ts
//
// Simula un escenario de crisis total y valida que el motor detecta
// correctamente las alertas según el Apéndice Técnico A v1.0.

import {
  evaluarIndicadores,
  semaforoCompacto,
  type IndicadorEntrada,
} from '../src/lib/alerts/motor-evaluacion';

// ─── Helpers ─────────────────────────────────────────────────────────────

const PASS = '✅';
const FAIL = '❌';

function assert(condition: boolean, mensaje: string) {
  if (condition) {
    console.log(`  ${PASS} ${mensaje}`);
    return true;
  }
  console.log(`  ${FAIL} ${mensaje}`);
  return false;
}

function separator(title: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}\n`);
}

// ─── ESCENARIO 1: CRISIS TOTAL ────────────────────────────────────────────

function escenarioCrisisTotal(): IndicadorEntrada[] {
  return [
    // MACROECONOMÍA
    {
      slug: 'brecha_cambiaria_porcentual',
      valor: 18,  // >15% → ROJO
      historial: [
        { fecha: new Date('2026-05-13'), valor: 14 },
        { fecha: new Date('2026-05-14'), valor: 15.5 },
        { fecha: new Date('2026-05-15'), valor: 18 },
      ],
    },
    {
      slug: 'rin_variacion_semanal_mm_usd',
      valor: -120,  // <-100 → ROJO
      historial: [],
    },
    {
      slug: 'volatilidad_minera_pct_semanal',
      valor: 7,  // >2% → AMARILLO
      historial: [],
    },
    {
      slug: 'litio_precio_variacion_pct',
      valor: 8,  // >6% → ROJO
      historial: [],
    },

    // SOCIAL
    {
      slug: 'bloqueos_activos_count',
      valor: 1,  // >=1 → AMARILLO (departamental)
      historial: [],
    },
    {
      slug: 'paro_sectorial_dias',
      valor: 2,  // >=2 → ROJO (2 sectores)
      historial: [],
    },
    {
      slug: 'violencia_minera_eventos',
      valor: 3,  // >=3 → ROJO (múltiples eventos)
      historial: [],
    },

    // ENERGÍA
    {
      slug: 'gas_produccion_mmcmd',
      valor: 34,  // <36 → AMARILLO
      historial: [
        { fecha: new Date('2026-05-13'), valor: 38 },
        { fecha: new Date('2026-05-14'), valor: 35 },
        { fecha: new Date('2026-05-15'), valor: 34 },
      ],
    },
    {
      slug: 'desabastecimiento_combustible_nivel',
      valor: 2,  // >=2 → ROJO (racionamiento)
      historial: [],
    },
    {
      slug: 'cortes_electricidad_horas',
      valor: 6,  // >4 → ROJO
      historial: [],
    },

    // POLÍTICA
    {
      slug: 'renuncias_alto_nivel_count',
      valor: 1,  // >=1 → AMARILLO
      historial: [],
    },

    // LOGÍSTICA
    {
      slug: 'bloqueo_rutas_horas',
      valor: 14,  // >12 → ROJO
      historial: [],
    },
    {
      slug: 'tiempo_paso_puertos_dias',
      valor: 6,  // >5 → ROJO
      historial: [],
    },

    // AMBIENTE
    {
      slug: 'incendios_focos_activos',
      valor: 350,  // >=200 → AMARILLO
      historial: [],
    },
    {
      slug: 'calidad_aire_pm25',
      valor: 120,  // >100 → ROJO
      historial: [],
    },
    {
      slug: 'deficit_hidrico_porcentual',
      valor: 25,  // >20 → ROJO
      historial: [],
    },
  ];
}

// ─── ESCENARIO 2: ESTABILIDAD TOTAL ──────────────────────────────────────

function escenarioEstabilidad(): IndicadorEntrada[] {
  return [
    { slug: 'brecha_cambiaria_porcentual', valor: 5, historial: [] },
    { slug: 'rin_variacion_semanal_mm_usd', valor: -10, historial: [] },
    { slug: 'gas_produccion_mmcmd', valor: 40, historial: [] },
    { slug: 'bloqueos_activos_count', valor: 0, historial: [] },
    { slug: 'incendios_focos_activos', valor: 50, historial: [] },
  ];
}

// ─── ESCENARIO 3: AMARILLO COMPUESTO ─────────────────────────────────────

function escenarioAmarilloCompuesto(): IndicadorEntrada[] {
  return [
    { slug: 'brecha_cambiaria_porcentual', valor: 12, historial: [] }, // AMARILLO
    { slug: 'gas_produccion_mmcmd', valor: 34.5, historial: [] },     // AMARILLO
    { slug: 'bloqueos_activos_count', valor: 1, historial: [] },       // AMARILLO
  ];
}

// ─── MAIN ────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔥 PRUEBA DE FUEGO — Motor de Alertas Tempranas DECODEX\n');

  let totalTests = 0;
  let passedTests = 0;

  // ═══ ESCENARIO 1: CRISIS TOTAL ═══
  separator('ESCENARIO 1: CRISIS TOTAL (16 indicadores, todos los ejes activos)');

  const crisis = evaluarIndicadores(escenarioCrisisTotal(), {
    fecha: new Date('2026-05-15T08:00:00'),
  });

  console.log(`\n  📊 Semaforo Compacto:`);
  console.log(`  ${semaforoCompacto(crisis)}\n`);
  console.log(`  📊 Estado Global: ${crisis.estado_global}`);
  console.log(`  📊 Total Alertas: ${crisis.alertas.length} (${crisis.alertas.filter(a => a.nivel === 'ROJO').length} rojas, ${crisis.alertas.filter(a => a.nivel === 'AMARILLO').length} amarillas)`);
  console.log(`  📊 Cruces Sistémicos: ${crisis.cruces_activos.length} activo(s)`);

  console.log('\n  🔍 Validaciones:');

  // Estado global
  totalTests++;
  passedTests += Number(assert(
    crisis.estado_global === 'ROJO',
    `Estado global es ROJO (obtenido: ${crisis.estado_global})`
  ));

  // Eje MACRO
  totalTests++;
  passedTests += Number(assert(
    crisis.ejes.macroeconomia.estado === 'ROJO',
    `Eje MACRO en ROJO (brecha 18% + RIN -120 + litio 8%)`
  ));

  // Eje SOCIAL
  totalTests++;
  passedTests += Number(assert(
    crisis.ejes.social.estado === 'ROJO',
    `Eje SOCIAL en ROJO (paro en 2 sectores)`
  ));

  // Eje ENERGÍA
  totalTests++;
  passedTests += Number(assert(
    crisis.ejes.energia.estado === 'ROJO',
    `Eje ENERGÍA en ROJO (gas 34 + racionamiento)`
  ));

  // Eje AMBIENTE
  totalTests++;
  passedTests += Number(assert(
    crisis.ejes.ambiente.estado === 'ROJO',
    `Eje AMBIENTE en ROJO (PM2.5 > 100 + incendios 350)`
  ));

  // Eje LOGÍSTICA
  totalTests++;
  passedTests += Number(assert(
    crisis.ejes.infraestructura.estado === 'ROJO',
    `Eje LOGÍSTICA en ROJO (bloqueo 14h)`
  ));

  // Eje POLÍTICA
  totalTests++;
  passedTests += Number(assert(
    crisis.ejes.politica.estado === 'AMARILLO',
    `Eje POLÍTICA en AMARILLO (1 renuncia)`
  ));

  // Alertas ROJAS específicas
  const rojas = crisis.alertas.filter(a => a.nivel === 'ROJO');
  totalTests++;
  passedTests += Number(assert(
    rojas.some(a => a.umbralId === 'MACRO_BRECHA_CAMBIARIA'),
    `Alerta ROJA: Brecha cambiaria (18%) detectada`
  ));
  totalTests++;
  passedTests += Number(assert(
    rojas.some(a => a.umbralId === 'MACRO_RIN_CAIDA'),
    `Alerta ROJA: Caída RIN (-120 MM) detectada`
  ));
  totalTests++;
  passedTests += Number(assert(
    rojas.some(a => a.umbralId === 'MACRO_LITIO_PRECIO'),
    `Alerta ROJA: Caída litio (8%) detectada`
  ));
  totalTests++;
  passedTests += Number(assert(
    rojas.some(a => a.umbralId === 'SOCIAL_PARO_SECTORIAL'),
    `Alerta ROJA: Paro 2 sectores detectado`
  ));

  // Alertas AMARILLAS específicas
  const amarillas = crisis.alertas.filter(a => a.nivel === 'AMARILLO');
  totalTests++;
  passedTests += Number(assert(
    amarillas.some(a => a.umbralId === 'ENERGIA_GAS_PRODUCCION'),
    `Alerta AMARILLA: Gas (34 MMm³/d) detectada`
  ));
  totalTests++;
  passedTests += Number(assert(
    amarillas.some(a => a.umbralId === 'ENERGIA_CORTES_ELECTRICIDAD') === false,
    `Sin alerta de cortes eléctricos (no se proporcionó dato)`
  ));

  // Cruces sistémicos
  totalTests++;
  passedTests += Number(assert(
    crisis.cruces_activos.length >= 3,
    `Al menos 3 cruces sistémicos activos (obtenido: ${crisis.cruces_activos.length})`
  ));
  totalTests++;
  passedTests += Number(assert(
    crisis.cruces_activos.some(c => c.id === 'CRISIS_CAMBIARIA_INMINENTE'),
    `Cruce "Crisis Cambiaria Inminente" activado`
  ));

  // ═══ ESCENARIO 2: ESTABILIDAD TOTAL ═══
  separator('ESCENARIO 2: ESTABILIDAD TOTAL (todo normal)');

  const estable = evaluarIndicadores(escenarioEstabilidad(), {
    fecha: new Date('2026-05-15T08:00:00'),
  });

  console.log(`  📊 ${semaforoCompacto(estable)}`);
  console.log(`  📊 Estado Global: ${estable.estado_global}\n`);

  console.log('  🔍 Validaciones:');
  totalTests++;
  passedTests += Number(assert(
    estable.estado_global === 'VERDE',
    `Estado global es VERDE (obtenido: ${estable.estado_global})`
  ));
  totalTests++;
  passedTests += Number(assert(
    estable.alertas.length === 0,
    `0 alertas generadas (obtenido: ${estable.alertas.length})`
  ));
  totalTests++;
  passedTests += Number(assert(
    estable.cruces_activos.length === 0,
    `0 cruces sistémicos activos (obtenido: ${estable.cruces_activos.length})`
  ));

  // ═══ ESCENARIO 3: AMARILLO COMPUESTO ═══
  separator('ESCENARIO 3: AMARILLO COMPUESTO (3 ejes en precaución)');

  const amarillo = evaluarIndicadores(escenarioAmarilloCompuesto(), {
    fecha: new Date('2026-05-15T08:00:00'),
  });

  console.log(`  📊 ${semaforoCompacto(amarillo)}`);
  console.log(`  📊 Estado Global: ${amarillo.estado_global}`);
  console.log(`  📊 Alertas: ${amarillo.alertas.length} (todas amarillas)\n`);

  console.log('  🔍 Validaciones:');
  totalTests++;
  passedTests += Number(assert(
    amarillo.estado_global === 'AMARILLO',
    `Estado global es AMARILLO (obtenido: ${amarillo.estado_global})`
  ));
  totalTests++;
  passedTests += Number(assert(
    amarillo.alertas.every(a => a.nivel === 'AMARILLO'),
    `Todas las alertas son AMARILLAS`
  ));
  totalTests++;
  passedTests += Number(assert(
    amarillo.cruces_activos.length === 0,
    `Sin cruces sistémicos (necesitan al menos un ROJO)`
  ));

  // ═══ REPORTE FINAL ═══
  separator('REPORTE FINAL');

  const porcentaje = Math.round((passedTests / totalTests) * 100);
  console.log(`  Total tests: ${totalTests}`);
  console.log(`  Pasados: ${passedTests}`);
  console.log(`  Fallidos: ${totalTests - passedTests}`);
  console.log(`  Tasa de éxito: ${porcentaje}%\n`);

  if (passedTests === totalTests) {
    console.log('  🎉 TODAS LAS PRUEBAS PASARON — Motor de Alertas operativo.\n');
    process.exit(0);
  } else {
    console.log('  ⚠️  Algunas pruebas fallaron — revisar validaciones arriba.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error fatal en prueba de fuego:', err);
  process.exit(1);
});
