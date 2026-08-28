'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { obtenerUsuario, puedeEditarMateriales } from '@/lib/sesion';
import type { EstadoMaterial } from '@/types/db';

export interface ResultadoAccion { ok: boolean; mensaje: string; }
const ESTADOS: EstadoMaterial[] = ['pendiente', 'preparado', 'faltante', 'ajustado'];

export async function guardarMateriales(_anterior: ResultadoAccion | null, formData: FormData): Promise<ResultadoAccion> {
  const visitaId = String(formData.get('visitaId') || '');
  const estadoMateriales = String(formData.get('estadoMateriales') || '') as EstadoMaterial;
  const detalle = String(formData.get('detalle') || '').trim();
  const os = String(formData.get('os') || '').trim();
  if (!visitaId) return { ok: false, mensaje: 'Falta la visita a actualizar.' };
  if (!ESTADOS.includes(estadoMateriales)) return { ok: false, mensaje: 'El estado de materiales no es válido.' };
  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, mensaje: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
  if (!puedeEditarMateriales(usuario.rol)) return { ok: false, mensaje: 'Tu cargo no tiene permiso para actualizar materiales.' };
  if (estadoMateriales === 'faltante' && !detalle) return { ok: false, mensaje: 'Indica en el detalle qué material está faltando.' };
  const supabase = await createClient();
  const { data: filas, error } = await supabase.from('visitas').update({ estado_materiales: estadoMateriales, detalle_materiales: detalle || null, os: os || null }).eq('id', visitaId).select('id');
  if (error) return { ok: false, mensaje: `No se pudo guardar: ${error.message}` };
  if (!filas?.length) return { ok: false, mensaje: 'No se guardó: no tienes permiso sobre esta visita o la sesión expiró.' };
  revalidatePath('/materiales'); revalidatePath('/programacion'); revalidatePath('/clientes');
  return { ok: true, mensaje: 'Materiales actualizados.' };
}
