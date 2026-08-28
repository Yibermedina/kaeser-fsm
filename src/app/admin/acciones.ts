'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { obtenerUsuario, type Rol } from '@/lib/sesion';

export interface ResultadoAccion { ok: boolean; mensaje: string; }
const ROLES: Rol[] = ['administrador', 'coordinador', 'service_logistician'];
const CONTRASENA_INICIAL = 'kaeser2026';

async function exigirAdministrador() {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' as const };
  if (usuario.rol !== 'administrador') return { error: 'Solo un administrador puede gestionar usuarios.' as const };
  return { usuario };
}

export async function cambiarEstadoUsuario(usuarioId: string, activo: boolean): Promise<ResultadoAccion> {
  const guardia = await exigirAdministrador();
  if ('error' in guardia) return { ok: false, mensaje: guardia.error ?? 'No autorizado.' };
  const supabase = await createClient();
  const { data: filas, error } = await supabase.from('usuarios').update({ activo }).eq('id', usuarioId).select('id');
  if (error) return { ok: false, mensaje: error.message };
  if (!filas?.length) return { ok: false, mensaje: 'No se pudo actualizar el usuario.' };
  revalidatePath('/admin/usuarios');
  return { ok: true, mensaje: activo ? 'Usuario activado.' : 'Usuario desactivado.' };
}

export async function restablecerContrasenaUsuario(usuarioId: string, nuevaContrasena: string = CONTRASENA_INICIAL): Promise<ResultadoAccion> {
  const guardia = await exigirAdministrador();
  if ('error' in guardia) return { ok: false, mensaje: guardia.error ?? 'No autorizado.' };
  const clave = nuevaContrasena.trim();
  if (!clave) return { ok: false, mensaje: 'La nueva contraseña no puede estar vacía.' };
  if (clave.length < 8) return { ok: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' };

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('Validación de clave service role antes de updateUserById:', {
    existe: Boolean(serviceRole && serviceRole !== 'undefined' && serviceRole !== 'null' && serviceRole.trim() !== ''),
    largo: serviceRole?.length ?? 0,
    preview: serviceRole ? `${serviceRole.slice(0, 6)}...` : null,
  });

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(usuarioId, {
    password: clave,
    user_metadata: { requiere_cambio_clave: true },
  });

  if (error || !data.user) return { ok: false, mensaje: error?.message ?? 'No se pudo actualizar la contraseña.' };

  revalidatePath('/admin/usuarios');
  return { ok: true, mensaje: `Se actualizó la contraseña de ${data.user.email ?? 'este usuario'}. Debe cambiarla al ingresar con la clave inicial: ${CONTRASENA_INICIAL}.` };
}

export async function guardarUsuario(_anterior: ResultadoAccion | null, formData: FormData): Promise<ResultadoAccion> {
  const guardia = await exigirAdministrador();
  if ('error' in guardia) return { ok: false, mensaje: guardia.error ?? 'No autorizado.' };
  const id = String(formData.get('id') || '');
  const nombre = String(formData.get('nombre') || '').trim();
  const correo = String(formData.get('correo') || '').trim().toLowerCase();
  const rol = String(formData.get('rol') || '') as Rol;
  const sucursal = String(formData.get('sucursal') || '').trim();
  if (!id || !nombre || !sucursal) return { ok: false, mensaje: 'Completa los campos obligatorios.' };
  if (!/^\S+@\S+\.\S+$/.test(correo)) return { ok: false, mensaje: 'El correo no tiene un formato válido.' };
  if (!ROLES.includes(rol)) return { ok: false, mensaje: 'El rol no es válido.' };
  if (rol === 'administrador' && sucursal.toLowerCase() !== 'nacional') return { ok: false, mensaje: 'Un administrador debe tener la sucursal "Nacional".' };
  const supabase = await createClient();
  const { data: filas, error } = await supabase.from('usuarios').update({ nombre, correo, rol, sucursal }).eq('id', id).select('id');
  if (error) return { ok: false, mensaje: error.code === '23505' ? 'Ya existe otro usuario con ese correo.' : error.message };
  if (!filas?.length) return { ok: false, mensaje: 'No se pudo actualizar el usuario.' };
  revalidatePath('/admin/usuarios'); revalidatePath('/admin');
  return { ok: true, mensaje: 'Usuario actualizado.' };
}

export async function crearUsuario(_anterior: ResultadoAccion | null, formData: FormData): Promise<ResultadoAccion> {
  const guardia = await exigirAdministrador();
  if ('error' in guardia) return { ok: false, mensaje: guardia.error ?? 'No autorizado.' };
  const nombre = String(formData.get('nombre') || '').trim();
  const correo = String(formData.get('correo') || '').trim().toLowerCase();
  const rol = String(formData.get('rol') || 'coordinador') as Rol;
  const sucursal = String(formData.get('sucursal') || '').trim();
  if (!nombre || !sucursal) return { ok: false, mensaje: 'Completa los campos obligatorios.' };
  if (!/^\S+@\S+\.\S+$/.test(correo)) return { ok: false, mensaje: 'El correo no es válido.' };
  if (!ROLES.includes(rol)) return { ok: false, mensaje: 'El rol no es válido.' };
  if (rol === 'administrador' && sucursal.toLowerCase() !== 'nacional') return { ok: false, mensaje: 'Un administrador debe tener la sucursal "Nacional".' };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email: correo, password: CONTRASENA_INICIAL, email_confirm: true, user_metadata: { requiere_cambio_clave: true } });
  if (error || !data.user) return { ok: false, mensaje: error?.message ?? 'No se pudo crear la cuenta.' };
  const { data: perfil, error: perfilError } = await admin.from('usuarios').insert({ id: data.user.id, nombre, correo, rol, sucursal, activo: true }).select('id');
  if (perfilError) { await admin.auth.admin.deleteUser(data.user.id); return { ok: false, mensaje: `No se pudo crear el perfil: ${perfilError.message}` }; }
  if (!perfil?.length) { await admin.auth.admin.deleteUser(data.user.id); return { ok: false, mensaje: 'No se pudo crear el perfil del usuario.' }; }
  revalidatePath('/admin/usuarios');
  return { ok: true, mensaje: `${nombre} creado. Contraseña inicial: ${CONTRASENA_INICIAL}. Deberá cambiarla al ingresar.` };
}
