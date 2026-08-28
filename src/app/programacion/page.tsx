import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { construirRejilla, rangoMes, hoyIso, MESES, aniosDisponibles } from '@/lib/fechas';
import type { FilaCalendario } from '@/types/db';
import FiltrosProgramacion from '@/components/programacion/FiltrosProgramacion';
import RejillaMes from '@/components/programacion/RejillaMes';
import PorProgramar from '@/components/programacion/PorProgramar';
import PanelVisita from '@/components/programacion/PanelVisita';
import { EsqueletoRejilla } from '@/components/programacion/Esqueletos';
import { requerirAcceso } from '@/lib/sesion';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ anio?: string; mes?: string; tecnico?: string; estado?: string; visita?: string }> };

export default async function PaginaProgramacion({ searchParams }: Props) {
  await requerirAcceso('/programacion');
  const p = await searchParams;
  const hoy = hoyIso();
  const anio = Number(p.anio) || Number(hoy.slice(0, 4));
  const mes = Number(p.mes) || Number(hoy.slice(5, 7));
  const filtroTecnico = p.tecnico ?? '';
  const filtroEstado = p.estado ?? '';
  const visitaAbierta = p.visita ?? '';
  const supabase = await createClient();
  const { data: tecnicos } = await supabase.from('tecnicos').select('id, nombre').eq('activo', true).order('nombre');

  return <div className="min-h-screen bg-[#f8f9fa]"><div className="mx-auto max-w-[1600px] p-4 md:p-6"><header className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold tracking-tight text-[#0C0C0C]">Programación</h1><p className="text-sm text-[#6B7280]">{MESES[mes - 1]} {anio}</p></div></header><FiltrosProgramacion anio={anio} mes={mes} tecnico={filtroTecnico} estado={filtroEstado} tecnicos={tecnicos ?? []} anios={aniosDisponibles()} /><div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]"><Suspense key={`${anio}-${mes}-${filtroTecnico}-${filtroEstado}`} fallback={<EsqueletoRejilla />}><ContenidoCalendario anio={anio} mes={mes} filtroTecnico={filtroTecnico} filtroEstado={filtroEstado} visitaAbierta={visitaAbierta} /></Suspense><aside className="xl:sticky xl:top-4 xl:self-start"><Suspense fallback={null}><PorProgramar anio={anio} mes={mes} filtroTecnico={filtroTecnico} filtroEstado={filtroEstado} /></Suspense></aside></div></div>{visitaAbierta && <Suspense fallback={null}><PanelVisita visitaId={visitaAbierta} tecnicos={tecnicos ?? []} /></Suspense>}</div>;
}

async function ContenidoCalendario({ anio, mes, filtroTecnico, filtroEstado, visitaAbierta }: { anio: number; mes: number; filtroTecnico: string; filtroEstado: string; visitaAbierta: string }) {
  const supabase = await createClient();
  const { primerDia, ultimoDia } = rangoMes(anio, mes);
  let consulta = supabase.from('vista_calendario').select('*').gte('fecha_inicio', primerDia).lte('fecha_inicio', ultimoDia).order('fecha_inicio').order('hora_inicio', { nullsFirst: true });
  if (filtroEstado) consulta = consulta.eq('estado', filtroEstado);
  if (filtroTecnico) consulta = consulta.contains('tecnicos_ids', [filtroTecnico]);
  const { data, error } = await consulta;
  if (error) return <div className="rounded-xl border border-[#F6CFCB] bg-[#FEECEC] p-4 text-sm text-[#B42318]"><p className="font-bold">No se pudo cargar el calendario</p><p className="mt-1">{error.message}</p></div>;
  const visitas = (data ?? []) as FilaCalendario[];
  const porDia = new Map<string, FilaCalendario[]>();
  for (const v of visitas) { if (!v.fecha_inicio) continue; const lista = porDia.get(v.fecha_inicio); if (lista) lista.push(v); else porDia.set(v.fecha_inicio, [v]); }
  return <RejillaMes semanas={construirRejilla(anio, mes)} porDia={porDia} totalVisitas={visitas.length} visitaAbierta={visitaAbierta} />;
}
