'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { MESES } from '@/lib/fechas';

export default function SelectorPeriodo({ anio, mes, anios }: { anio: number; mes: number; anios: number[] }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams(); const [pendiente, iniciar] = useTransition();
  function actualizar(cambios: Record<string, string>) { const params = new URLSearchParams(searchParams.toString()); for (const [clave, valor] of Object.entries(cambios)) params.set(clave, valor); iniciar(() => router.replace(`${pathname}?${params}`, { scroll: false })); }
  const control = 'rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-[#FDC100]';
  return <div className="flex items-center gap-2"><select value={mes} onChange={(e) => actualizar({ mes: e.target.value })} className={control} aria-label="Mes">{MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select><select value={anio} onChange={(e) => actualizar({ anio: e.target.value })} className={control} aria-label="Año">{anios.map((a) => <option key={a} value={a}>{a}</option>)}</select>{pendiente && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E9ECEF] border-t-[#FDC100]" aria-label="Actualizando" />}</div>;
}
