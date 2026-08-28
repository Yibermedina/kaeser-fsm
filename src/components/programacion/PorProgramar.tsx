import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { rangoMes } from '@/lib/fechas';
import type { FilaCalendario } from '@/types/db';
import { CLASES_ESTADO, ETIQUETA_ESTADO } from '@/lib/formato';

export default async function PorProgramar({ anio, mes, filtroTecnico, filtroEstado }: { anio: number; mes: number; filtroTecnico: string; filtroEstado: string }) {
  const supabase = await createClient();
  const { primerDia } = rangoMes(anio, mes);
  let consulta = supabase.from('vista_calendario').select('visita_id, cliente_nombre, contrato_numero, numero_visita, estado, tecnicos_nombres, tecnicos_ids').eq('periodo', primerDia).is('fecha_inicio', null).order('cliente_nombre').limit(100);
  if (filtroEstado) consulta = consulta.eq('estado', filtroEstado);
  if (filtroTecnico) consulta = consulta.contains('tecnicos_ids', [filtroTecnico]);
  const { data, error } = await consulta;
  if (error) return null;
  const visitas = (data ?? []) as FilaCalendario[];
  return <section className="rounded-[22px] border border-[#E4E7EB] bg-white shadow-sm"><header className="border-b border-[#E4E7EB] px-4 py-3"><h2 className="text-sm font-extrabold text-[#0C0C0C]">Por programar</h2><p className="text-xs text-[#6B7280]">{visitas.length === 0 ? 'Todo el mes tiene fecha asignada.' : `${visitas.length} visita${visitas.length === 1 ? '' : 's'} del mes sin fecha`}</p></header>{visitas.length > 0 && <ul className="max-h-[560px] overflow-y-auto p-2">{visitas.map((v) => <li key={v.visita_id}><Link href={`?visita=${v.visita_id}`} scroll={false} className="block rounded-xl px-2 py-2 transition hover:bg-[#f8f9fa]"><div className="flex items-start justify-between gap-2"><span className="min-w-0 flex-1 truncate text-sm font-bold text-[#0C0C0C]">{v.cliente_nombre}</span><span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase ${CLASES_ESTADO[v.estado]}`}>{ETIQUETA_ESTADO[v.estado]}</span></div><p className="truncate font-mono text-[0.7rem] text-[#6B7280]">CTR {v.contrato_numero} · Visita {v.numero_visita ?? '—'}</p><p className="truncate text-[0.7rem] text-[#6B7280]">{v.tecnicos_nombres?.length ? v.tecnicos_nombres.join(', ') : 'Sin técnico'}</p></Link></li>)}</ul>}</section>;
}
