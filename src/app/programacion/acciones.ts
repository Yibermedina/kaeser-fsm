'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { EstadoVisita } from '@/types/db';

export interface ResultadoAccion {
  ok: boolean;
  mensaje: string;
  visitaNuevaId?: string;
  requiereUnion?: boolean;
  visitaDestinoId?: string;
}

const ESTADOS: EstadoVisita[] = ['pendiente', 'programado', 'ejecutado', 'reprogramada'];
const SIN_PERMISO = 'No se guardó: no tienes permiso sobre esta visita, o la sesión expiró.';

function revalidarTodo() {
  for (const ruta of ['/programacion', '/clientes', '/materiales', '/admin', '/admin/sabana']) {
    revalidatePath(ruta);
  }
}

export async function guardarVisita(
  _anterior: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const visitaId = String(formData.get('visitaId') || '');
  const estado = String(formData.get('estado') || '') as EstadoVisita;
  const fechaInicio = String(formData.get('fechaInicio') || '').trim();
  const fechaFin = String(formData.get('fechaFin') || '').trim();
  const horaInicio = String(formData.get('horaInicio') || '').trim();
  const horaFin = String(formData.get('horaFin') || '').trim();
  const os = String(formData.get('os') || '').trim();
  const observaciones = String(formData.get('observaciones') || '').trim();
  const tecnicos = formData.getAll('tecnicos').map(String).filter(Boolean);

  if (!visitaId) return { ok: false, mensaje: 'Falta la visita a actualizar.' };
  if (!ESTADOS.includes(estado)) return { ok: false, mensaje: 'El estado no es válido.' };

  const requiereAgenda = estado === 'programado' || estado === 'ejecutado';
  if (requiereAgenda && !fechaInicio) return { ok: false, mensaje: 'Debes indicar la fecha de inicio de la visita.' };
  if (requiereAgenda && tecnicos.length === 0) return { ok: false, mensaje: 'Debes asignar al menos un técnico responsable.' };
  if (estado === 'ejecutado' && !os) return { ok: false, mensaje: 'El número de OS es obligatorio para una visita ejecutada.' };
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) return { ok: false, mensaje: 'La fecha de finalización debe ser igual o posterior a la de inicio.' };
  if (horaInicio && horaFin && fechaInicio === fechaFin && horaFin <= horaInicio) return { ok: false, mensaje: 'La hora de salida debe ser posterior a la de llegada.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensaje: 'Tu sesión expiró. Vuelve a iniciar sesión.' };

  const { data: yo } = await supabase.from('usuarios').select('id').eq('correo', user.email ?? '').maybeSingle();
  const { data: filas, error: errorVisita } = await supabase.from('visitas').update({
    estado, fecha_inicio: fechaInicio || null, fecha_fin: fechaFin || fechaInicio || null,
    hora_inicio: horaInicio || null, hora_fin: horaFin || null, os: os || null,
    observaciones: observaciones || null, actualizado_por: yo?.id ?? null,
  }).eq('id', visitaId).select('id');

  if (errorVisita) return { ok: false, mensaje: `No se pudo guardar: ${errorVisita.message}` };
  if (!filas?.length) return { ok: false, mensaje: SIN_PERMISO };

  const { error: errorBorrado } = await supabase.from('visita_tecnicos').delete().eq('visita_id', visitaId);
  if (errorBorrado) return { ok: false, mensaje: `Visita guardada, pero no se pudo actualizar el equipo: ${errorBorrado.message}` };

  if (tecnicos.length) {
    const { data: insertados, error: errorInsercion } = await supabase.from('visita_tecnicos').insert(
      tecnicos.map((tecnico_id) => ({ visita_id: visitaId, tecnico_id }))
    ).select('tecnico_id');
    if (errorInsercion) return { ok: false, mensaje: `Visita guardada, pero fallaron los técnicos: ${errorInsercion.message}` };
    if (insertados?.length !== tecnicos.length) return { ok: false, mensaje: 'Visita guardada, pero no se pudieron asignar todos los técnicos.' };
  }

  revalidarTodo();
  return { ok: true, mensaje: 'Visita actualizada correctamente.' };
}

export async function moverVisita(visitaId: string, nuevaFecha: string): Promise<ResultadoAccion> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) return { ok: false, mensaje: 'La fecha no es válida.' };
  const supabase = await createClient();
  const { data: visita, error } = await supabase.from('visitas').select('fecha_inicio, fecha_fin').eq('id', visitaId).maybeSingle();
  if (error || !visita) return { ok: false, mensaje: 'No se encontró la visita.' };

  let nuevaFin = nuevaFecha;
  if (visita.fecha_inicio && visita.fecha_fin) {
    const dias = Math.round((Date.parse(`${visita.fecha_fin}T00:00:00Z`) - Date.parse(`${visita.fecha_inicio}T00:00:00Z`)) / 86400000);
    if (dias > 0) nuevaFin = new Date(Date.parse(`${nuevaFecha}T00:00:00Z`) + dias * 86400000).toISOString().slice(0, 10);
  }

  const { data: filas, error: errorUpdate } = await supabase.from('visitas').update({ fecha_inicio: nuevaFecha, fecha_fin: nuevaFin }).eq('id', visitaId).select('id');
  if (errorUpdate) return { ok: false, mensaje: errorUpdate.message };
  if (!filas?.length) return { ok: false, mensaje: SIN_PERMISO };
  revalidarTodo();
  return { ok: true, mensaje: `Visita movida al ${nuevaFecha.split('-').reverse().join('/')}.` };
}

export async function reprogramarAOtroMes(visitaId: string, nuevoPeriodo: string): Promise<ResultadoAccion> {
  if (!/^\d{4}-\d{2}-01$/.test(nuevoPeriodo)) return { ok: false, mensaje: 'El periodo destino debe ser el día 1 de un mes.' };
  const supabase = await createClient();
  const { data: original } = await supabase.from('visitas').select('id, contrato_id, periodo, numero_visita').eq('id', visitaId).maybeSingle();
  if (!original) return { ok: false, mensaje: 'No se encontró la visita a reprogramar.' };
  const { data: ocupada } = await supabase.from('visitas').select('id, numero_visita').eq('contrato_id', original.contrato_id).eq('periodo', nuevoPeriodo).maybeSingle();
  if (ocupada) return { ok: false, requiereUnion: true, visitaDestinoId: ocupada.id, mensaje: `Ese mes ya tiene la visita ${ocupada.numero_visita ?? '—'}. ¿Quieres unirlas?` };
  const { data: nueva, error: insertError } = await supabase.from('visitas').insert({ contrato_id: original.contrato_id, periodo: nuevoPeriodo, estado: 'pendiente', origen_visita_id: original.id }).select('id').single();
  if (insertError || !nueva) return { ok: false, mensaje: insertError?.message ?? 'No se pudo crear la visita.' };
  const { data: marcadas, error: updateError } = await supabase.from('visitas').update({ estado: 'reprogramada' }).eq('id', original.id).select('id');
  if (updateError || !marcadas?.length) return { ok: false, mensaje: updateError?.message ?? SIN_PERMISO, visitaNuevaId: nueva.id };
  revalidarTodo();
  return { ok: true, mensaje: `Visita reprogramada a ${nuevoPeriodo.slice(5, 7)}/${nuevoPeriodo.slice(0, 4)}.`, visitaNuevaId: nueva.id };
}

export async function unirVisitas(visitaOrigenId: string, visitaDestinoId: string): Promise<ResultadoAccion> {
  if (!visitaOrigenId || !visitaDestinoId) return { ok: false, mensaje: 'Faltan las visitas a unir.' };
  const { data, error } = await (await createClient()).rpc('unir_visitas', { p_origen: visitaOrigenId, p_destino: visitaDestinoId });
  if (error) return { ok: false, mensaje: error.message };
  revalidarTodo();
  return { ok: true, mensaje: `Visitas unidas como "${(data as { numero?: string } | null)?.numero ?? ''}".` };
}
