import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requerirAcceso } from '@/lib/sesion';
import FilaUsuario from '@/components/admin/FilaUsuario';
import FormularioNuevoUsuario from '@/components/admin/FormularioNuevoUsuario';

export const dynamic = 'force-dynamic';
export interface UsuarioAdmin { id: string; nombre: string; correo: string; rol: 'administrador' | 'coordinador' | 'service_logistician'; sucursal: string; activo: boolean; }

export default async function GestionUsuarios() {
  const yo = await requerirAcceso('/admin');
  const supabase = await createClient();
  const { data, error } = await supabase.from('usuarios').select('id, nombre, correo, rol, sucursal, activo').order('activo', { ascending: false }).order('nombre');
  const usuarios = (data ?? []) as UsuarioAdmin[];
  return <div className="min-h-screen bg-[#f8f9fa]"><div className="mx-auto max-w-[1100px] p-4 md:p-6"><header className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-extrabold">Usuarios</h1><p className="text-sm text-[#6B7280]">{usuarios.filter((u) => u.activo).length} activos de {usuarios.length}</p></div><Link href="/admin" className="rounded-xl border border-[#E4E7EB] bg-white px-4 py-2 text-sm font-bold">← Panel Nacional</Link></header><FormularioNuevoUsuario />{error ? <div className="mt-4 rounded-xl bg-[#FEECEC] p-4 text-sm text-[#B42318]">No se pudo cargar la lista: {error.message}</div> : <div className="mt-4 overflow-x-auto rounded-[22px] border border-[#E4E7EB] bg-white shadow-sm"><table className="w-full text-left"><thead className="bg-[#f8f9fa] text-[0.7rem] font-extrabold uppercase text-[#6B7280]"><tr><th className="px-5 py-3">Nombre y correo</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Sucursal</th><th className="px-5 py-3 text-right">Acceso</th></tr></thead><tbody>{usuarios.map((usuario) => <FilaUsuario key={usuario.id} usuario={usuario} esYo={usuario.id === yo.id} />)}</tbody></table></div>}</div></div>;
}
