'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarMateriales, type ResultadoAccion } from '@/app/materiales/acciones';
import { ETIQUETA_MATERIAL } from '@/lib/formato';
import type { EstadoMaterial } from '@/types/db';

const ESTADOS: EstadoMaterial[] = ['pendiente', 'preparado', 'ajustado', 'faltante'];
export default function FormularioMateriales({ visitaId, estadoMateriales, detalle, os }: { visitaId: string; estadoMateriales: EstadoMaterial; detalle: string | null; os: string | null }) {
  const router = useRouter(); const [estado, setEstado] = useState(estadoMateriales);
  const [resultado, enviar, enviando] = useActionState<ResultadoAccion | null, FormData>(async (previo, formData) => { const r = await guardarMateriales(previo, formData); if (r.ok) router.refresh(); return r; }, null);
  const campo = 'w-full rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25'; const etiqueta = 'mb-1 block text-xs font-bold text-[#41454D]';
  return <form action={enviar} className="space-y-4"><input type="hidden" name="visitaId" value={visitaId} /><div><label className={etiqueta} htmlFor="estadoMateriales">Estado del alistamiento</label><select id="estadoMateriales" name="estadoMateriales" value={estado} onChange={(e) => setEstado(e.target.value as EstadoMaterial)} className={`${campo} font-bold`}>{ESTADOS.map((e) => <option key={e} value={e}>{ETIQUETA_MATERIAL[e]}</option>)}</select></div><div><label className={etiqueta} htmlFor="detalle">Detalle de repuestos e insumos {estado === 'faltante' && <span className="text-[#DC2626]"> *</span>}</label><textarea id="detalle" name="detalle" rows={4} defaultValue={detalle ?? ''} placeholder={estado === 'faltante' ? 'Indica qué material está faltando' : 'Ej.: filtros, aceite, correas…'} className={campo} /></div><div><label className={etiqueta} htmlFor="os">Número de OS</label><input id="os" name="os" defaultValue={os ?? ''} placeholder="Opcional" className={campo} /></div>{resultado && <p className={`rounded-xl border px-3 py-2 text-sm ${resultado.ok ? 'border-[#C9E0D3] bg-[#E8F1EC] text-[#14432A]' : 'border-[#F6CFCB] bg-[#FEECEC] text-[#B42318]'}`} role="status">{resultado.mensaje}</p>}<button type="submit" disabled={enviando} className="flex w-full items-center justify-center rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] disabled:opacity-60">{enviando ? 'Guardando…' : 'Confirmar alistamiento'}</button></form>;
}
