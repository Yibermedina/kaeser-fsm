'use client';

import { useActionState } from 'react';
import { crearUsuario, type ResultadoAccion } from '@/app/admin/acciones';

export default function FormularioUsuario() {
  const [resultado, enviar, enviando] = useActionState<ResultadoAccion | null, FormData>(crearUsuario, null);
  const campo = 'mt-1 w-full rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25';
  return (
    <form action={enviar} className="space-y-4 rounded-[22px] border border-[#E4E7EB] bg-white p-6 shadow-sm">
      <label className="block text-sm font-bold">Nombre<input name="nombre" required className={campo} /></label>
      <label className="block text-sm font-bold">Correo corporativo<input name="correo" type="email" required className={campo} /></label>
      <label className="block text-sm font-bold">Sucursal<input name="sucursal" required className={campo} /></label>
      <label className="block text-sm font-bold">Rol<select name="rol" defaultValue="coordinador" className={campo}><option value="coordinador">Coordinador</option><option value="service_logistician">Service Logistician</option><option value="administrador">Administrador</option></select></label>
      <p className="rounded-xl border border-[#F3DFA0] bg-[#FFF7DB] p-3 text-sm text-[#8A6A00]">La contraseña inicial será <strong>Kaeser2026*</strong>. El usuario deberá cambiarla al ingresar.</p>
      {resultado && <p className={resultado.ok ? 'rounded-xl bg-[#E8F1EC] p-3 text-sm text-[#14432A]' : 'rounded-xl bg-[#FEECEC] p-3 text-sm text-[#B42318]'} role="status">{resultado.mensaje}</p>}
      <button type="submit" disabled={enviando} className="w-full rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] disabled:opacity-60">{enviando ? 'Creando…' : 'Crear usuario'}</button>
    </form>
  );
}
