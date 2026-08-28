'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { MESES, mesRelativo } from '@/lib/fechas';
import type { EstadoVisita } from '@/types/db';
import { ETIQUETA_ESTADO } from '@/lib/formato';

const ESTADOS: EstadoVisita[] = ['pendiente', 'programado', 'ejecutado', 'reprogramada'];

export default function FiltrosProgramacion({ anio, mes, tecnico, estado, tecnicos, anios }: {
  anio: number; mes: number; tecnico: string; estado: string;
  tecnicos: { id: string; nombre: string }[]; anios: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendiente, iniciar] = useTransition();

  function actualizar(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor); else params.delete(clave);
    }
    params.delete('visita');
    iniciar(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  }
  function navegarMes(delta: number) {
    const destino = mesRelativo(anio, mes, delta);
    actualizar({ anio: String(destino.anio), mes: String(destino.mes) });
  }
  const control = 'rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm font-semibold outline-none transition focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-[#E4E7EB] bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1">
        <button onClick={() => navegarMes(-1)} aria-label="Mes anterior" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4E7EB] transition hover:bg-[#f8f9fa]">‹</button>
        <button onClick={() => { const h = new Date(); actualizar({ anio: String(h.getFullYear()), mes: String(h.getMonth() + 1) }); }} className="rounded-xl border border-[#E4E7EB] px-3 py-2 text-sm font-bold transition hover:bg-[#f8f9fa]">Hoy</button>
        <button onClick={() => navegarMes(1)} aria-label="Mes siguiente" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4E7EB] transition hover:bg-[#f8f9fa]">›</button>
      </div>
      <select value={mes} onChange={(e) => actualizar({ mes: e.target.value })} className={control} aria-label="Mes">{MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
      <select value={anio} onChange={(e) => actualizar({ anio: e.target.value })} className={control} aria-label="Año">{anios.map((a) => <option key={a} value={a}>{a}</option>)}</select>
      <span className="mx-1 h-6 w-px bg-[#E9ECEF]" aria-hidden />
      <select value={tecnico} onChange={(e) => actualizar({ tecnico: e.target.value })} className={control} aria-label="Técnico"><option value="">Todos mis técnicos</option>{tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select>
      <select value={estado} onChange={(e) => actualizar({ estado: e.target.value })} className={control} aria-label="Estado"><option value="">Todos los estados</option>{ESTADOS.map((e) => <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>)}</select>
      {(tecnico || estado) && <button onClick={() => actualizar({ tecnico: '', estado: '' })} className="rounded-xl px-3 py-2 text-sm font-bold text-[#6B7280] underline-offset-2 hover:underline">Limpiar</button>}
      {pendiente && <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-[#E9ECEF] border-t-[#FDC100]" aria-label="Actualizando" />}
    </div>
  );
}
