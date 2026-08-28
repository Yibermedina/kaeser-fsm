'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { MESES } from '@/lib/fechas';
import { ETIQUETA_MATERIAL } from '@/lib/formato';
import type { EstadoMaterial } from '@/types/db';

const ESTADOS: EstadoMaterial[] = ['pendiente', 'preparado', 'ajustado', 'faltante'];

export default function FiltrosMateriales({ anio, mes, material, coordinador, q, coordinadores, anios }: { anio: number; mes: number; material: string; coordinador: string; q: string; coordinadores: { id: string; nombre: string }[]; anios: number[] }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const [pendiente, iniciar] = useTransition(); const [texto, setTexto] = useState(q); const primeraVez = useRef(true);
  function actualizar(cambios: Record<string, string>) { const params = new URLSearchParams(searchParams.toString()); for (const [k, v] of Object.entries(cambios)) { if (v) params.set(k, v); else params.delete(k); } params.delete('visita'); iniciar(() => router.replace(`${pathname}?${params}`, { scroll: false })); }
  useEffect(() => { if (primeraVez.current) { primeraVez.current = false; return; } const t = setTimeout(() => { const params = new URLSearchParams(searchParams.toString()); const valor = texto.trim(); if (valor) params.set('q', valor); else params.delete('q'); params.delete('visita'); iniciar(() => router.replace(`${pathname}?${params}`, { scroll: false })); }, 250); return () => clearTimeout(t); }, [texto, iniciar, pathname, router, searchParams]);
  const control = 'rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm font-semibold outline-none transition focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25';
  return <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-[#E4E7EB] bg-white p-3 shadow-sm"><select value={mes} onChange={(e) => actualizar({ mes: e.target.value })} className={control} aria-label="Mes">{MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select><select value={anio} onChange={(e) => actualizar({ anio: e.target.value })} className={control} aria-label="Año">{anios.map((a) => <option key={a} value={a}>{a}</option>)}</select><select value={coordinador} onChange={(e) => actualizar({ coordinador: e.target.value })} className={control} aria-label="Coordinador"><option value="">Todos mis coordinadores</option>{coordinadores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select><select value={material} onChange={(e) => actualizar({ material: e.target.value })} className={control} aria-label="Estado de materiales"><option value="">Todos los estados</option>{ESTADOS.map((e) => <option key={e} value={e}>{ETIQUETA_MATERIAL[e]}</option>)}</select><input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar cliente o contrato…" className={`${control} min-w-[220px] flex-1 font-normal`} aria-label="Buscar" />{(material || coordinador || texto) && <button onClick={() => { setTexto(''); actualizar({ material: '', coordinador: '', q: '' }); }} className="rounded-xl px-3 py-2 text-sm font-bold text-[#6B7280] underline-offset-2 hover:underline">Limpiar</button>}{pendiente && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E9ECEF] border-t-[#FDC100]" aria-label="Actualizando" />}</div>;
}
