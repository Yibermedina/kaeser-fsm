import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import FormularioVisita from './FormularioVisita';
import { formatearPeriodo, ETIQUETA_MATERIAL } from '@/lib/formato';
import BorradorCorreo from './BorradorCorreo';
import { obtenerUsuario } from '@/lib/sesion';
import AccionesReprogramar from './AccionesReprogramar';

export default async function PanelVisita({ visitaId, tecnicos }: { visitaId: string; tecnicos: { id: string; nombre: string }[] }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('visitas').select(`
      id, periodo, numero_visita, estado, fecha_inicio, fecha_fin,
      hora_inicio, hora_fin, os, observaciones, estado_materiales, detalle_materiales,
      contratos ( numero, clientes ( nombre, ciudad, direccion, nombre_contacto, telefono_contacto, correo_cliente ) ),
      visita_tecnicos ( tecnico_id, tecnicos ( id, nombre, correo, cedula, placa ) )
    `).eq('id', visitaId).maybeSingle();

  if (error || !data) return <Contenedor><p className="rounded-xl border border-[#F6CFCB] bg-[#FEECEC] p-4 text-sm text-[#B42318]">No se pudo cargar la visita{error ? `: ${error.message}` : '.'}</p></Contenedor>;
  const contrato = data.contratos as unknown as { numero: string; clientes: { nombre: string; ciudad: string | null; direccion: string | null; nombre_contacto: string | null; telefono_contacto: string | null; correo_cliente: string | null } | null } | null;
  const cliente = contrato?.clientes ?? null;
  const asignados = (data.visita_tecnicos ?? []).map((vt: { tecnico_id: string }) => vt.tecnico_id);
  const yo = await obtenerUsuario();

  return <Contenedor>
    <header className="mb-4 border-b border-[#E4E7EB] pb-4">
      <span className="mb-2 inline-block rounded-md bg-[#0C0C0C] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-[#FDC100]">Visita {data.numero_visita ?? '—'} · {formatearPeriodo(data.periodo)}</span>
      <h2 className="text-lg font-extrabold leading-tight text-[#0C0C0C]">{cliente?.nombre ?? 'Cliente'}</h2>
      <p className="mt-1 font-mono text-xs text-[#6B7280]">Contrato {contrato?.numero ?? '—'}</p>
      {(cliente?.direccion || cliente?.ciudad) && <p className="mt-2 text-xs text-[#4B5563]">{[cliente?.direccion, cliente?.ciudad].filter(Boolean).join(' · ')}</p>}
      {cliente?.nombre_contacto && <p className="text-xs text-[#4B5563]">Contacto: {cliente.nombre_contacto}{cliente.telefono_contacto ? ` · ${cliente.telefono_contacto}` : ''}</p>}
    </header>
    <FormularioVisita visita={{ id: data.id, estado: data.estado, fecha_inicio: data.fecha_inicio, fecha_fin: data.fecha_fin, hora_inicio: data.hora_inicio, hora_fin: data.hora_fin, os: data.os, observaciones: data.observaciones }} tecnicos={tecnicos} asignados={asignados} />
    <AccionesReprogramar visitaId={data.id} periodoActual={data.periodo} />
    <div className="mt-5"><BorradorCorreo correoCliente={cliente?.correo_cliente ?? null} datos={{ cliente: cliente?.nombre ?? 'Cliente', contacto: cliente?.nombre_contacto ?? null, fechaInicio: data.fecha_inicio, horaInicio: data.hora_inicio, tecnicos: (data.visita_tecnicos ?? []).flatMap((vt: { tecnicos?: { nombre: string; cedula: string | null; placa: string | null }[] }) => vt.tecnicos ?? []).map((tecnico) => ({ nombre: tecnico.nombre, cedula: tecnico.cedula, placa: tecnico.placa })), firma: yo?.nombre ?? 'Kaeser Service FSM' }} /></div>
    <div className="mt-5 rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] p-3"><p className="mb-1 text-xs font-bold text-[#41454D]">Materiales</p><p className="text-sm text-[#4B5563]">{ETIQUETA_MATERIAL[data.estado_materiales as keyof typeof ETIQUETA_MATERIAL] ?? '—'}</p>{data.detalle_materiales && <p className="mt-1 whitespace-pre-wrap text-xs text-[#6B7280]">{data.detalle_materiales}</p>}</div>
  </Contenedor>;
}

function Contenedor({ children }: { children: React.ReactNode }) {
  return <><Link href="?" scroll={false} aria-label="Cerrar detalle" className="fixed inset-0 z-40 bg-[#0C0C0C]/50 backdrop-blur-[2px]" /><aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-[#E4E7EB] bg-white p-5 shadow-2xl"><Link href="?" scroll={false} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#E9ECEF] text-[#41454D] transition hover:bg-[#DDE1E6]">✕</Link>{children}</aside></>;
}
