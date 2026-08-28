/**
 * ============================================================================
 * KAESER FSM · FASE 2 · Migración Excel -> Supabase
 * ============================================================================
 * Lee "Programador Coordinadores.xlsx" y carga las 11 tablas de Postgres.
 *
 * USO:
 *   node --env-file=.env migrar.mjs            (simulacro: no escribe nada)
 *   node --env-file=.env migrar.mjs --escribir (carga real)
 *
 * Requiere Node >= 20.6 (por --env-file).
 *
 * ⚠ Usa la SERVICE_ROLE_KEY porque debe saltarse las políticas RLS.
 *   Esa llave NUNCA debe ir al navegador ni subirse a git.
 * ============================================================================
 */

import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const ARCHIVO = 'Programador Coordinadores.xlsx';
const ESCRIBIR = process.argv.includes('--escribir');
const LOTE = 500;

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✖ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}
const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const avisos = [];
const avisar = (m) => { if (!avisos.includes(m)) avisos.push(m); };

/** Texto limpio. Los números de contrato vienen como 35362988.0 -> "35362988" */
function txt(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && v.richText) v = v.richText.map(t => t.text).join('');
  if (typeof v === 'object' && v.text) v = v.text;
  if (typeof v === 'object' && v.result !== undefined) v = v.result;
  let s = String(v).trim();
  if (/^-?\d+\.0$/.test(s)) s = s.slice(0, -2);
  return s;
}

/** Sin acentos y en minúscula, para comparar nombres/correos */
function norm(v) {
  return txt(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Date | 'YYYY-MM-DD' | 'DD/MM/YYYY' -> 'YYYY-MM-DD' */
function fecha(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v)) {
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}-${String(v.getUTCDate()).padStart(2, '0')}`;
  }
  const s = txt(v);
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

/** '10:00' | Date | 0.4166 (fracción de día) -> 'HH:MM' */
function hora(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v)) {
    return `${String(v.getUTCHours()).padStart(2, '0')}:${String(v.getUTCMinutes()).padStart(2, '0')}`;
  }
  if (typeof v === 'number' && v >= 0 && v < 1) {
    const min = Math.round(v * 24 * 60);
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  }
  const m = txt(v).match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

const MESES = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
/** 'Apr-26' -> '2026-04-01' */
function periodoDesdeClave(v) {
  const m = norm(v).match(/^([a-z]{3})-(\d{2})$/);
  if (!m || !MESES[m[1]]) return null;
  return `20${m[2]}-${String(MESES[m[1]]).padStart(2, '0')}-01`;
}
/** Date de encabezado -> '2026-04-01' */
function periodoDesdeFecha(d) {
  if (!(d instanceof Date) || isNaN(d)) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

// --- Estado por color de celda: MISMA lógica que inferirEstadoDesdeColor_ en Code.gs ---
const COLOR_ESTADO = {
  fff2cc: 'programado', fce5cd: 'programado', ffd966: 'programado',
  d9ead3: 'ejecutado',  b6d7a8: 'ejecutado',  '93c47d': 'ejecutado', '00ff00': 'ejecutado',
  f4cccc: 'pendiente',  ea9999: 'pendiente',  e6b8af: 'pendiente'
};
function estadoDesdeColor(celda) {
  const f = celda.fill;
  if (!f || f.pattern !== 'solid' || !f.fgColor || !f.fgColor.argb) return '';
  const hex = String(f.fgColor.argb).toLowerCase().replace(/^ff/, '');
  return COLOR_ESTADO[hex] || '';
}

const mapEstado = (v) => ({ programado: 'programado', ejecutado: 'ejecutado', reprogramada: 'reprogramada' }[norm(v)] || 'pendiente');
const mapMaterial = (v) => {
  const n = norm(v);
  if (n.startsWith('prepar')) return 'preparado';
  if (n.startsWith('faltan')) return 'faltante';
  if (n.includes('ajustad')) return 'ajustado';
  return 'pendiente';
};
const mapConfirmacion = (v) => {
  const n = norm(v);
  if (n.startsWith('confirmad')) return 'confirmado';
  if (n.startsWith('reprogram')) return 'reprogramar';
  if (n.startsWith('rechaz')) return 'rechazado';
  return 'pendiente';
};
const mapRol = (v) => {
  const n = norm(v);
  if (n.includes('logistic')) return 'service_logistician';
  if (n.includes('administrador') || n === 'admin') return 'administrador';
  return 'coordinador';
};
const mapTipoNovedad = (v) => {
  const n = norm(v);
  if (n.startsWith('reunion')) return 'reunion';
  if (n.startsWith('capacita')) return 'capacitacion';
  if (n.startsWith('permiso')) return 'permiso';
  if (n.includes('medic')) return 'cita_medica';
  if (n.includes('personal')) return 'actividades_personales';
  if (n.startsWith('vacacion')) return 'vacaciones';
  if (n.startsWith('incapacid')) return 'incapacidad';
  if (n.includes('puntual')) return 'servicio_puntual';
  avisar(`Tipo de novedad no reconocido: "${txt(v)}" -> se guardó como 'permiso'`);
  return 'permiso';
};

/** Separa "Juan, Pedro" o "Juan; Pedro" en nombres */
const listaNombres = (v) => txt(v).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

async function insertar(tabla, filas, onConflict) {
  if (!filas.length) { console.log(`  ${tabla}: 0`); return; }
  if (!ESCRIBIR) { console.log(`  ${tabla}: ${filas.length} (simulacro)`); return; }
  let hechos = 0;
  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE);
    const q = onConflict
      ? supa.from(tabla).upsert(lote, { onConflict })
      : supa.from(tabla).insert(lote);
    const { error } = await q;
    if (error) throw new Error(`[${tabla}] ${error.message}${error.details ? ' · ' + error.details : ''}`);
    hechos += lote.length;
    process.stdout.write(`\r  ${tabla}: ${hechos}/${filas.length}`);
  }
  process.stdout.write('\n');
}

// ---------------------------------------------------------------------------
// MIGRACIÓN
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n${ESCRIBIR ? '▶ CARGA REAL' : '◇ SIMULACRO (sin escribir) — añade --escribir para cargar'}\n`);

  if (ESCRIBIR) {
    const { count } = await supa.from('contratos').select('*', { count: 'exact', head: true });
    if (count > 0) {
      console.error(`✖ La tabla 'contratos' ya tiene ${count} filas.`);
      console.error('  Vacía las tablas antes de recargar (ver TRUNCATE en las instrucciones).');
      process.exit(1);
    }
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(ARCHIVO);
  const hoja = (n) => wb.getWorksheet(n);
  const filasDe = (ws) => { const r = []; ws.eachRow((row, i) => { if (i > 1) r.push(row); }); return r; };
  const c = (row, i) => row.getCell(i).value;

  // ---- 1. USUARIOS (Ingresos) --------------------------------------------
  const usuarios = [];
  const usuarioPorNombre = new Map();
  const usuarioPorCorreo = new Map();
  const nuevoUsuario = (nombre, correo, rol, sucursal, activo = true) => {
    const claveN = norm(nombre), claveC = norm(correo);
    if (claveC && usuarioPorCorreo.has(claveC)) return usuarioPorCorreo.get(claveC);
    if (!claveC && claveN && usuarioPorNombre.has(claveN)) return usuarioPorNombre.get(claveN);
    const u = { id: randomUUID(), nombre: txt(nombre), correo: txt(correo).toLowerCase(), rol, sucursal: txt(sucursal) || 'Sin sucursal', activo };
    usuarios.push(u);
    if (claveN) usuarioPorNombre.set(claveN, u);
    if (claveC) usuarioPorCorreo.set(claveC, u);
    return u;
  };

  for (const row of filasDe(hoja('Ingresos'))) {
    const correo = txt(c(row, 4));
    if (!correo.includes('@')) continue;
    nuevoUsuario(c(row, 3), correo, mapRol(c(row, 2)), c(row, 1));
  }

  // Service Logistician: crea los que no estén en Ingresos
  const relLogistician = [];
  for (const row of filasDe(hoja('Service Logistician'))) {
    const coord = nuevoUsuario(c(row, 1), c(row, 2), 'coordinador', '');
    const correoLog = txt(c(row, 4));
    if (!correoLog.includes('@')) continue;
    const log = nuevoUsuario(c(row, 3), correoLog, 'service_logistician', '');
    relLogistician.push({ logistician_id: log.id, coordinador_id: coord.id });
  }

  // ---- 2. CLIENTES + CONTRATOS (Programador) ------------------------------
  const wsProg = hoja('Programador');
  const encabezados = wsProg.getRow(1).values; // 1-indexado
  const columnasMes = [];
  for (let i = 1; i < encabezados.length; i++) {
    const p = periodoDesdeFecha(encabezados[i]);
    if (p) columnasMes.push({ col: i, periodo: p });
  }

  const clientes = [], contratos = [], visitas = [];
  const clientePorClave = new Map();
  const contratosPorNumero = new Map();
  let sinContrato = 0, coordInventados = 0;

  for (const row of filasDe(wsProg)) {
    const numero = txt(c(row, 2));
    if (!numero) { sinContrato++; continue; }

    const nombreCoord = txt(c(row, 1));
    let coord = usuarioPorNombre.get(norm(nombreCoord));
    if (!coord && nombreCoord) {
      // Coordinador con contratos pero sin fila en Ingresos (p. ej. Agustin Ortiz).
      // Se crea inactivo y con correo marcador para no dejar contratos huérfanos.
      coord = nuevoUsuario(nombreCoord, `pendiente.${norm(nombreCoord).replace(/\s+/g, '.')}@kaeser.local`, 'coordinador', '', false);
      coordInventados++;
      avisar(`Coordinador sin fila en Ingresos: "${nombreCoord}" -> creado INACTIVO, corrige su correo`);
    }

    const nombreCli = txt(c(row, 4)) || 'Sin nombre';
    const codigo = txt(c(row, 3));
    const claveCli = `${codigo}|${norm(nombreCli)}`;
    let cli = clientePorClave.get(claveCli);
    if (!cli) {
      cli = {
        id: randomUUID(), codigo_cliente: codigo || null, nombre: nombreCli,
        ciudad: txt(c(row, 5)) || null, direccion: txt(c(row, 8)) || null,
        nombre_contacto: txt(c(row, 6)) || null, telefono_contacto: txt(c(row, 7)) || null,
        correo_cliente: txt(c(row, 9)) || null
      };
      clientes.push(cli);
      clientePorClave.set(claveCli, cli);
    }

    const ctr = {
      id: randomUUID(), numero, cliente_id: cli.id,
      coordinador_id: coord ? coord.id : null,
      asesor: txt(c(row, 15)) || null,
      valido_desde: fecha(c(row, 10)), valido_hasta: fecha(c(row, 11)),
      activo: true
    };
    contratos.push(ctr);
    if (!contratosPorNumero.has(numero)) contratosPorNumero.set(numero, []);
    contratosPorNumero.get(numero).push(ctr);

    // Pivote: cada columna de mes con valor -> una fila en 'visitas'
    for (const { col, periodo } of columnasMes) {
      const celda = row.getCell(col);
      const valor = txt(celda.value);
      if (!valor) continue;
      visitas.push({
        id: randomUUID(), contrato_id: ctr.id, periodo,
        numero_visita: valor,
        estado: estadoDesdeColor(celda) || 'pendiente', // el color manda, igual que hoy
        _porColor: Boolean(estadoDesdeColor(celda))
      });
    }
  }

  // ---- 3. TÉCNICOS (Proceso Service) --------------------------------------
  const tecnicos = [];
  const tecnicoPorNombre = new Map();
  const tecnicoPorCorreo = new Map();
  for (const row of filasDe(hoja('Proceso Service'))) {
    const nombre = txt(c(row, 1));
    if (!nombre || tecnicoPorNombre.has(norm(nombre))) continue;
    const correo = txt(c(row, 2)).toLowerCase();
    const coord = usuarioPorNombre.get(norm(c(row, 4)));
    const t = {
      id: randomUUID(), nombre, correo: correo || null,
      cargo: txt(c(row, 3)) || null, cedula: null, placa: null,
      coordinador_id: coord ? coord.id : null, activo: true
    };
    tecnicos.push(t);
    tecnicoPorNombre.set(norm(nombre), t);
    if (correo) tecnicoPorCorreo.set(norm(correo), t);
  }

  /**
   * En Registros y Novedades el técnico aparece unas veces por NOMBRE y otras
   * por CORREO (verificado sobre los datos reales). Buscar solo por nombre
   * descartaba la mitad de las novedades, así que se intenta por ambos.
   */
  function buscarTecnico(valor) {
    const k = norm(valor);
    return tecnicoPorNombre.get(k) || tecnicoPorCorreo.get(k) || null;
  }

  // ---- 4. REGISTROS -> detalle operativo sobre 'visitas' -------------------
  const visitaPorClave = new Map(visitas.map(v => [`${v.contrato_id}|${v.periodo}`, v]));
  const visitaTecnicos = [];
  let regSinContrato = 0, regSinCelda = 0, regAplicados = 0, ambiguos = 0;

  for (const row of filasDe(hoja('Registros'))) {
    const numero = txt(c(row, 2));
    const periodo = periodoDesdeClave(c(row, 4));
    if (!numero || !periodo) continue;

    const posibles = contratosPorNumero.get(numero);
    if (!posibles) { regSinContrato++; continue; }
    if (posibles.length > 1) {
      ambiguos++;
      avisar(`Contrato repetido "${numero}": el detalle de Registros se asignó al primero`);
    }
    const ctr = posibles[0];

    let v = visitaPorClave.get(`${ctr.id}|${periodo}`);
    if (!v) {
      // Hay registro operativo pero el cronograma no tenía número ese mes.
      v = { id: randomUUID(), contrato_id: ctr.id, periodo, numero_visita: null, estado: 'pendiente', _porColor: false };
      visitas.push(v);
      visitaPorClave.set(`${ctr.id}|${periodo}`, v);
      regSinCelda++;
    }

    // El color de la celda tiene prioridad (resolverEstadoVisita_ en Code.gs)
    if (!v._porColor) v.estado = mapEstado(c(row, 5));

    const fIni = fecha(c(row, 17)) || fecha(c(row, 7));
    v.fecha_inicio = fIni;
    v.fecha_fin = fecha(c(row, 18)) || fIni;
    v.hora_inicio = hora(c(row, 8));
    v.hora_fin = hora(c(row, 9));
    v.os = txt(c(row, 10)) || null;
    v.confirmacion = mapConfirmacion(c(row, 11));
    v.observaciones = txt(c(row, 12)) || null;
    v.estado_materiales = mapMaterial(c(row, 14));
    v.detalle_materiales = txt(c(row, 15)) || null;
    v.union_pendiente_periodo = periodoDesdeClave(c(row, 21));
    regAplicados++;

    for (const nom of listaNombres(txt(c(row, 19)) || txt(c(row, 6)))) {
      const t = buscarTecnico(nom);
      if (t) visitaTecnicos.push({ visita_id: v.id, tecnico_id: t.id });
      else avisar(`Técnico en Registros que no existe en Proceso Service: "${nom}"`);
    }
  }
  // Sin duplicados en la tabla puente
  const vtUnicos = [...new Map(visitaTecnicos.map(x => [`${x.visita_id}|${x.tecnico_id}`, x])).values()];

  // ---- 5. NOVEDADES -------------------------------------------------------
  const novedades = [], novedadTecnicos = [];
  for (const row of filasDe(hoja('Novedades personal'))) {
    const fi = fecha(c(row, 1));
    if (!fi) continue;
    const nov = {
      id: randomUUID(), fecha_inicio: fi, fecha_fin: fecha(c(row, 2)) || fi,
      tipo: mapTipoNovedad(c(row, 4)), nota: txt(c(row, 5)) || null, creado_por: null
    };
    let ligado = false;
    for (const nom of listaNombres(c(row, 3))) {
      const t = buscarTecnico(nom);
      if (t) { novedadTecnicos.push({ novedad_id: nov.id, tecnico_id: t.id }); ligado = true; }
      else avisar(`Técnico en Novedades que no existe en Proceso Service: "${nom}"`);
    }
    if (ligado) novedades.push(nov);
    else avisar(`Novedad del ${fi} OMITIDA: ningún técnico reconocido en "${txt(c(row, 3))}"`);
  }

  // ---- 6. VISITAS ADICIONALES ---------------------------------------------
  const adicionales = [];
  for (const row of filasDe(hoja('Visitas adicionales'))) {
    const posibles = contratosPorNumero.get(txt(c(row, 4)));
    const f = fecha(c(row, 6));
    if (!posibles || !f) continue;
    const autor = usuarioPorCorreo.get(norm(c(row, 10)));
    adicionales.push({
      id: randomUUID(), contrato_id: posibles[0].id, fecha: f,
      tipo: txt(c(row, 7)) || 'Sin tipo', informacion: txt(c(row, 8)) || null,
      registrado_por: autor ? autor.id : null
    });
  }

  // ---- 7. CARGA (respetando el orden de las llaves foráneas) --------------
  const limpias = visitas.map((visita) => {
    const limpia = { ...visita };
    delete limpia._porColor;
    return limpia;
  });

  console.log('Resumen a cargar:');
  await insertar('usuarios', usuarios, 'correo');
  await insertar('clientes', clientes);
  await insertar('contratos', contratos);
  await insertar('tecnicos', tecnicos);
  await insertar('visitas', limpias);
  await insertar('visita_tecnicos', vtUnicos);
  await insertar('novedades', novedades);
  await insertar('novedad_tecnicos', novedadTecnicos);
  await insertar('visitas_adicionales', adicionales);
  await insertar('logistician_coordinador', relLogistician);

  // ---- 8. Informe ---------------------------------------------------------
  const porEstado = limpias.reduce((a, v) => (a[v.estado] = (a[v.estado] || 0) + 1, a), {});
  console.log(`
──────────────────────────────────────────
  Filas de Programador sin contrato:  ${sinContrato} (omitidas)
  Coordinadores creados inactivos:    ${coordInventados}
  Registros aplicados a una visita:   ${regAplicados}
  Registros de contratos inexistentes:${regSinContrato} (omitidos)
  Visitas creadas solo por Registros: ${regSinCelda}
  Registros de contratos ambiguos:    ${ambiguos}
  Estado de las visitas: ${JSON.stringify(porEstado)}
──────────────────────────────────────────`);
  if (avisos.length) {
    console.log('\n⚠ Avisos:');
    avisos.slice(0, 25).forEach(a => console.log('   · ' + a));
    if (avisos.length > 25) console.log(`   … y ${avisos.length - 25} más`);
  }
  console.log(ESCRIBIR ? '\n✔ Carga completada.\n' : '\n◇ Simulacro terminado. Ejecuta con --escribir para cargar.\n');
}

main().catch(e => { console.error('\n✖ ' + e.message); process.exit(1); });
