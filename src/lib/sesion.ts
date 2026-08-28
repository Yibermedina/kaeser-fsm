import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type Rol = 'administrador' | 'coordinador' | 'service_logistician';
export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  sucursal: string;
  requiereCambioClave: boolean;
}

export const obtenerUsuario = cache(async (): Promise<UsuarioSesion | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data } = await supabase.from('usuarios').select('id, nombre, correo, rol, sucursal').eq('correo', user.email).maybeSingle();
  return data ? {
    ...(data as Omit<UsuarioSesion, 'requiereCambioClave'>),
    requiereCambioClave: false,
  } : null;
});

export const MODULOS_POR_ROL: Record<Rol, string[]> = {
  coordinador: ['/clientes', '/programacion'],
  service_logistician: ['/materiales'],
  administrador: ['/admin', '/clientes', '/programacion', '/materiales', '/admin/usuarios'],
};

export function rutaInicial(rol: Rol): string { return MODULOS_POR_ROL[rol]?.[0] ?? '/clientes'; }

export async function requerirAcceso(ruta: string): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect('/login');
  if (!MODULOS_POR_ROL[usuario.rol]?.includes(ruta)) redirect(rutaInicial(usuario.rol));
  return usuario;
}

export function puedeEditarMateriales(rol: Rol): boolean { return rol === 'service_logistician'; }

export function esAdministrador(rol: Rol): boolean { return rol === 'administrador'; }
