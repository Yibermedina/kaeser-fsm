// ============================================================================
// Formato y estilos compartidos (paleta KAESER)
// ============================================================================
import type { EstadoVisita, EstadoMaterial } from '../types/db';

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/** '2026-08-01' -> 'Ago 2026'  (sin new Date(): evita el corrimiento por zona horaria) */
export function formatearPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-');
  return `${MESES_CORTOS[Number(mes) - 1] ?? mes} ${anio}`;
}

/** '2026-08-14' -> '14/08/2026' */
export function formatearFecha(fecha: string | null): string {
  if (!fecha) return 'Fecha por definir';
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

/** '09:30:00' -> '09:30' (formato militar, sin a. m./p. m.) */
export function formatearHora(hora: string | null): string {
  return hora ? hora.slice(0, 5) : '--:--';
}

export const ETIQUETA_ESTADO: Record<EstadoVisita, string> = {
  pendiente: 'Pendiente',
  programado: 'Programado',
  ejecutado: 'Ejecutado',
  reprogramada: 'Reprogramada',
};

/** Clases del badge de estado */
export const CLASES_ESTADO: Record<EstadoVisita, string> = {
  programado:   'bg-[#FFF7DB] text-[#8A6A00] border-[#F3DFA0]',
  ejecutado:    'bg-[#E8F1EC] text-[#14432A] border-[#C9E0D3]',
  pendiente:    'bg-[#FEECEC] text-[#B42318] border-[#F6CFCB]',
  reprogramada: 'bg-[#FFF1E4] text-[#B54708] border-[#F7D9BC]',
};

/** Franja lateral de la tarjeta de visita */
export const BORDE_ESTADO: Record<EstadoVisita, string> = {
  programado:   'border-l-[#FDC100]',
  ejecutado:    'border-l-[#14432A]',
  pendiente:    'border-l-[#DC2626]',
  reprogramada: 'border-l-[#F97316]',
};

export const ETIQUETA_MATERIAL: Record<EstadoMaterial, string> = {
  pendiente: 'Pendientes',
  preparado: 'Preparado',
  faltante:  'Faltante',
  ajustado:  'Materiales ajustados',
};

export const CLASES_MATERIAL: Record<EstadoMaterial, string> = {
  preparado: 'bg-[#E8F1EC] text-[#14432A]',
  pendiente: 'bg-[#FFF7DB] text-[#8A6A00]',
  faltante:  'bg-[#FEECEC] text-[#B42318]',
  ajustado:  'bg-[#E7F0FF] text-[#1D4ED8]',
};

/** Color estable a partir del nombre, para el avatar (igual que la app actual) */
export function colorDesdeTexto(texto: string): string {
  if (!texto?.trim()) return '#94a3b8';
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '000000'.substring(0, 6 - c.length) + c;
}

export function iniciales(nombre: string): string {
  if (!nombre?.trim()) return 'NA';
  return nombre.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
