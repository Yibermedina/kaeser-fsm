'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearUsuario, type ResultadoAccion } from '@/app/admin/acciones';

export default function FormularioNuevoUsuario() {
  const router = useRouter(); const [abierto, setAbierto] = useState(false);
  const [resultado, enviar, enviando] = useActionState<ResultadoAccion | null, FormData>(async (previo, formData) => { const r = await crearUsuario(previo, formData); if (r.ok) { setAbierto(false); router.refresh(); } return r; }, null);
  const campo = 'w-full rounded-lg border border-[#E4E7EB] px-3 py-2 text-sm outline-none focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25';
  if (!abierto) return <div className="flex items-center gap-3"><button onClick={() => setAbierto(true)} className="rounded-xl bg-[#0C0C0C] px-4 py-2.5 text-sm font-bold text-[#FDC100]">+ Agregar usuario</button>{resultado?.ok && <span className="text-sm font-semibold text-[#14432A]">{resultado.mensaje}</span>}</div>;
  return <form action={enviar} className="rounded-[22px] border border-[#E4E7EB] bg-white p-4 shadow-sm"><p className="mb-3 text-sm font-extrabold">Nuevo usuario</p><div className="grid grid-cols-1 gap-2 md:grid-cols-4"><input name="nombre" placeholder="Nombre completo" className={campo} required /><input name="correo" type="email" placeholder="nombre@kaeser.com" className={campo} required /><select name="rol" defaultValue="coordinador" className={campo}><option value="coordinador">Coordinador</option><option value="service_logistician">Service Logistician</option><option value="administrador">Administrador</option></select><input name="sucursal" placeholder="Sucursal" className={campo} required /></div><p className="mt-3 rounded-lg bg-[#FFF7DB] px-3 py-2 text-xs text-[#8A6A00]">Contraseña inicial: <strong>Kaeser2026*</strong>. Deberá cambiarla al ingresar.</p>{resultado && !resultado.ok && <p className="mt-3 rounded-lg bg-[#FEECEC] px-3 py-2 text-sm text-[#B42318]">{resultado.mensaje}</p>}<div className="mt-3 flex gap-2"><button type="submit" disabled={enviando} className="rounded-lg bg-[#0C0C0C] px-4 py-2 text-sm font-bold text-[#FDC100] disabled:opacity-60">{enviando ? 'Creando…' : 'Crear usuario'}</button><button type="button" onClick={() => setAbierto(false)} className="rounded-lg border border-[#E4E7EB] px-4 py-2 text-sm font-bold">Cancelar</button></div></form>;
}
