'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { obtenerUsuario, type Rol } from '@/lib/sesion';

export interface ResultadoAccion { ok: boolean; mensaje: string; }
const ROLES: Rol[] = ['administrador', 'coordinador', 'service_logistician'];

async function exigirAdministrador() {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: 'Tu sesión expiró. Vuelve a iniciar sesión.' as const };
  if (usuario.rol !== 'administrador') return { error: 'Solo un administrador puede gestionar usuarios.' as const };
  return { usuario };
}

export async function iniciarSesionConCorreo(emailInput: string): Promise<{ ok: boolean; redirectTo?: string; error?: string }> {
  const email = emailInput.toLowerCase().trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, error: 'El correo no está registrado.' };
  }

  const admin = createAdminClient();
  const { data: usuariosAuth, error: authError } = await admin.auth.admin.listUsers();
  const usuarioAuth = usuariosAuth?.users.find((u) => u.email?.toLowerCase() === email);

  if (authError || !usuarioAuth) {
    return { ok: false, error: 'El correo no está registrado.' };
  }

  const supabase = await createClient();
  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('rol, activo')
    .eq('correo', email)
    .maybeSingle<{ rol: Rol; activo: boolean }>();

  if (perfilError || !perfil || !perfil.activo || !['administrador', 'coordinador', 'service_logistician'].includes(perfil.rol)) {
    return { ok: false, error: 'El correo no está registrado.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('user_email', email, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, secure: true });
  cookieStore.set('user_rol', perfil.rol, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, secure: true });
  cookieStore.set('user_id', usuarioAuth.id, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, secure: true });

  const redirectTo = perfil.rol === 'administrador' ? '/admin' : perfil.rol === 'service_logistician' ? '/materiales' : '/clientes';
  return { ok: true, redirectTo };
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
  const { data, error } = await admin.auth.admin.createUser({ email: correo, email_confirm: true });
  if (error || !data.user) return { ok: false, mensaje: error?.message ?? 'No se pudo crear la cuenta.' };
  const { data: perfil, error: perfilError } = await admin.from('usuarios').insert({ id: data.user.id, nombre, correo, rol, sucursal, activo: true }).select('id');
  if (perfilError) { await admin.auth.admin.deleteUser(data.user.id); return { ok: false, mensaje: `No se pudo crear el perfil: ${perfilError.message}` }; }
  if (!perfil?.length) { await admin.auth.admin.deleteUser(data.user.id); return { ok: false, mensaje: 'No se pudo crear el perfil del usuario.' }; }
  revalidatePath('/admin/usuarios');
  return { ok: true, mensaje: `${nombre} creado. Se enviará un enlace de acceso al correo indicado.` };
}
