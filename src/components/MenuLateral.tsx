import Link from 'next/link';
import { obtenerUsuario, MODULOS_POR_ROL, type Rol } from '@/lib/sesion';
import CerrarSesion from './Clientes/CerrarSesion';

const MODULOS: Record<string, { etiqueta: string; icono: string }> = {
  '/admin': { etiqueta: 'Panel Nacional', icono: 'M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z' },
  '/clientes': { etiqueta: 'Clientes', icono: 'M15 19.1a9.4 9.4 0 002.6.4 9.3 9.3 0 004.1-1 4.1 4.1 0 00-7.5-2.5M15 19.1v-.1c0-1.1-.3-2.2-.8-3.1M15 19.1v.1A12.3 12.3 0 018.6 21c-2.3 0-4.5-.6-6.4-1.8v-.1a6.4 6.4 0 0112-3.1M12 6.4a3.4 3.4 0 11-6.8 0 3.4 3.4 0 016.8 0zm8.3 2.2a2.6 2.6 0 11-5.3 0 2.6 2.6 0 015.3 0z' },
  '/programacion': { etiqueta: 'Programación', icono: 'M6.8 3v2.3M17.3 3v2.3M3.3 18.6V7.5a2.3 2.3 0 012.2-2.2h13a2.3 2.3 0 012.2 2.2v11.1m-16.9 0a2.3 2.3 0 002.2 2.2h12.5a2.3 2.3 0 002.2-2.2m-16.9 0V11a2.3 2.3 0 012.2-2.2h12.5a2.3 2.3 0 012.2 2.2v7.6' },
  '/materiales': { etiqueta: 'Materiales', icono: 'M20.3 7.5l-8.2 4.7m0 0L3.8 7.5m8.3 4.7v9.2M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' },
  '/admin/usuarios': { etiqueta: 'Usuarios', icono: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0M19 8v6m-3-3h6' },
};
const ETIQUETA_ROL: Record<Rol, string> = { administrador: 'Administrador', coordinador: 'Coordinador', service_logistician: 'Service Logistician' };

export default async function MenuLateral() {
  const usuario = await obtenerUsuario();
  if (!usuario) return null;
  return <aside className="flex w-[76px] shrink-0 flex-col justify-between bg-[#FDC100] xl:w-[250px]"><div><div className="flex h-20 items-center justify-center px-3 xl:justify-start xl:px-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0C0C0C] text-lg font-extrabold text-[#FDC100]">K</div><div className="ml-3 hidden leading-tight xl:block"><p className="text-base font-extrabold tracking-tight text-[#0C0C0C]">PROGRAMADOR</p><p className="text-[0.7rem] font-bold tracking-wide text-[#0C0C0C]/70">COORDINADORES KAESER</p></div></div><nav className="flex flex-col gap-2 px-3 py-3">{(MODULOS_POR_ROL[usuario.rol] ?? []).map((ruta) => { const modulo = MODULOS[ruta]; return modulo ? <Link key={ruta} href={ruta} className="flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#0C0C0C] transition hover:bg-[#0C0C0C]/10 xl:justify-start xl:px-4" title={modulo.etiqueta}><svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d={modulo.icono} /></svg><span className="hidden xl:inline">{modulo.etiqueta}</span></Link> : null; })}</nav></div><div className="border-t border-[#0C0C0C]/15 p-3"><div className="mb-2 hidden xl:block"><p className="truncate text-sm font-extrabold text-[#0C0C0C]">{usuario.nombre}</p><p className="truncate text-[0.7rem] font-semibold text-[#0C0C0C]/70">{ETIQUETA_ROL[usuario.rol]} · {usuario.sucursal}</p></div><CerrarSesion /></div></aside>;
}
