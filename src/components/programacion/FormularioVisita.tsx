'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarVisita, type ResultadoAccion } from '@/app/programacion/acciones';
import type { EstadoVisita } from '@/types/db';
import { ETIQUETA_ESTADO } from '@/lib/formato';

const ESTADOS: EstadoVisita[] = ['pendiente', 'programado', 'ejecutado', 'reprogramada'];
interface VisitaEditable { id: string; estado: EstadoVisita; fecha_inicio: string | null; fecha_fin: string | null; hora_inicio: string | null; hora_fin: string | null; os: string | null; observaciones: string | null; }

export default function FormularioVisita({ visita, tecnicos, asignados }: { visita: VisitaEditable; tecnicos: { id: string; nombre: string }[]; asignados: string[]; }) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoVisita>(visita.estado);
  const [seleccion, setSeleccion] = useState<string[]>(asignados);
  const [resultado, enviar, enviando] = useActionState<ResultadoAccion | null, FormData>(
    async (previo, formData) => {
      const r = await guardarVisita(previo, formData);
      if (r.ok) router.refresh();
      return r;
    }, null
  );
  const requiereAgenda = estado === 'programado' || estado === 'ejecutado';
  const requiereOS = estado === 'ejecutado';
  const campo = 'w-full rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25';
  const etiqueta = 'mb-1 block text-xs font-bold text-[#41454D]';

  return (
    <form action={enviar} className="space-y-4">
      <input type="hidden" name="visitaId" value={visita.id} />
      <div><label className={etiqueta} htmlFor="estado">Estado de la visita</label><select id="estado" name="estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoVisita)} className={`${campo} font-bold`}>{ESTADOS.map((e) => <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={etiqueta} htmlFor="fechaInicio">Fecha inicio {requiereAgenda && <span className="text-[#DC2626]">*</span>}</label><input id="fechaInicio" name="fechaInicio" type="date" defaultValue={visita.fecha_inicio ?? ''} className={campo} /></div>
        <div><label className={etiqueta} htmlFor="fechaFin">Fecha fin</label><input id="fechaFin" name="fechaFin" type="date" defaultValue={visita.fecha_fin ?? ''} className={campo} /></div>
        <div><label className={etiqueta} htmlFor="horaInicio">Llegada (24 h)</label><input id="horaInicio" name="horaInicio" type="time" defaultValue={visita.hora_inicio?.slice(0, 5) ?? ''} className={campo} /></div>
        <div><label className={etiqueta} htmlFor="horaFin">Salida (24 h)</label><input id="horaFin" name="horaFin" type="time" defaultValue={visita.hora_fin?.slice(0, 5) ?? ''} className={campo} /></div>
      </div>
      <div><label className={etiqueta} htmlFor="os">OS {requiereOS && <span className="text-[#DC2626]">*</span>}</label><input id="os" name="os" defaultValue={visita.os ?? ''} placeholder={requiereOS ? 'Obligatorio para visita ejecutada' : 'Opcional'} className={campo} /></div>
      <fieldset><legend className={etiqueta}>Técnicos {requiereAgenda && <span className="text-[#DC2626]">*</span>}</legend><div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] p-2">{tecnicos.length === 0 && <p className="p-1 text-xs italic text-[#6B7280]">No tienes técnicos asignados.</p>}{tecnicos.map((t) => { const marcado = seleccion.includes(t.id); return <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-sm"><input type="checkbox" name="tecnicos" value={t.id} checked={marcado} onChange={(e) => setSeleccion((prev) => e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id))} className="h-4 w-4 accent-[#14432A]" /><span className="truncate">{t.nombre}</span></label>; })}</div><p className="mt-1 text-[0.7rem] text-[#6B7280]">{seleccion.length ? `${seleccion.length} seleccionado(s)` : 'Sin técnicos seleccionados'}</p></fieldset>
      <div><label className={etiqueta} htmlFor="observaciones">Notas internas</label><textarea id="observaciones" name="observaciones" rows={3} defaultValue={visita.observaciones ?? ''} className={campo} /></div>
      {resultado && <p className={`rounded-xl border px-3 py-2 text-sm ${resultado.ok ? 'border-[#C9E0D3] bg-[#E8F1EC] text-[#14432A]' : 'border-[#F6CFCB] bg-[#FEECEC] text-[#B42318]'}`} role="status">{resultado.mensaje}</p>}
      <button type="submit" disabled={enviando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] transition hover:bg-black disabled:opacity-60">{enviando && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#FDC100]/40 border-t-[#FDC100]" />}{enviando ? 'Guardando…' : 'Guardar cambios'}</button>
    </form>
  );
}
