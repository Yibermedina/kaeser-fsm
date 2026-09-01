import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requerirAcceso } from '@/lib/sesion';
import { aniosDisponibles, hoyIso } from '@/lib/fechas';
import SelectorAnioSabana from '@/components/admin/SelectorAnioSabana';

export const dynamic = 'force-dynamic';
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
type Fila = { contrato_id: string; contrato: string; cliente: string; ciudad: string | null; coordinador: string | null; sucursal: string; periodo: string; fecha_inicio: string | null; numero_visita: string | null; fue_reprogramada: boolean };
type Props = { searchParams: Promise<{ anio?: string; sucursal?: string; coordinador?: string }> };
type Contrato = { id: string; numero: string; clientes: { nombre: string; ciudad: string | null } | null; usuarios: { nombre: string; sucursal: string } | null };

export default async function VistaSabana({ searchParams }: Props) {
  const usuario = await requerirAcceso('/admin/sabana');
  const p = await searchParams;
  const anio = Number(p.anio) || Number(hoyIso().slice(0, 4));
  const sucursal = usuario.rol === 'administrador' ? (p.sucursal ?? '') : usuario.sucursal;
  const coordinadorSeleccionado = usuario.rol === 'administrador' ? (p.coordinador ?? '') : usuario.id;
  const supabase = await createClient();

  const [{ data: coordinadores, error: coordinadoresError }, contratosResult] = await Promise.all([
    usuario.rol === 'administrador'
      ? supabase.from('usuarios').select('id, nombre, sucursal').eq('rol', 'coordinador').eq('activo', true).order('nombre')
      : Promise.resolve({ data: [], error: null }),
    cargarContratos(supabase, coordinadorSeleccionado, sucursal, usuario.id),
  ]);
  if (coordinadoresError) return <Error mensaje={coordinadoresError.message} />;
  if (contratosResult.error) return <Error mensaje={contratosResult.error.message} />;

  const contratos = (contratosResult.data ?? []) as Contrato[];
  const ids = contratos.map((contrato) => contrato.id);
  const { data: visitas, error: visitasError } = ids.length
    ? await supabase.from('vista_sabana').select('*').in('contrato_id', ids).gte('periodo', `${anio}-01-01`).lte('periodo', `${anio}-12-01`)
    : { data: [], error: null };
  if (visitasError) return <Error mensaje={visitasError.message} />;

  const contratosMap = new Map(contratos.map((contrato) => [contrato.id, contrato]));
  const mapa = new Map<string, { contrato: string; cliente: string; ciudad: string | null; coordinador: string; sucursal: string; meses: (Fila | undefined)[] }>();
  for (const contrato of contratos) {
    mapa.set(contrato.id, {
      contrato: contrato.numero,
      cliente: contrato.clientes?.nombre ?? 'Sin cliente',
      ciudad: contrato.clientes?.ciudad ?? null,
      coordinador: contrato.usuarios?.nombre ?? '—',
      sucursal: contrato.usuarios?.sucursal ?? '—',
      meses: Array<Fila | undefined>(12).fill(undefined),
    });
  }
  for (const visita of (visitas ?? []) as Fila[]) {
    const contrato = contratosMap.get(visita.contrato_id);
    if (!contrato) continue;
    const actual = mapa.get(visita.contrato_id);
    if (!actual) continue;
    const mes = Number(String(visita.periodo).slice(5, 7)) - 1;
    if (mes >= 0 && mes < 12) actual.meses[mes] = visita;
    mapa.set(visita.contrato_id, actual);
  }

  const sucursales = [...new Set((coordinadores ?? []).map((coordinador) => coordinador.sucursal).filter(Boolean))].sort();
  const query = new URLSearchParams({ anio: String(anio) });
  if (sucursal && usuario.rol === 'administrador') query.set('sucursal', sucursal);
  if (coordinadorSeleccionado && usuario.rol === 'administrador') query.set('coordinador', coordinadorSeleccionado);

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Vista sábana</h1><p className="text-sm text-[#6B7280]">{mapa.size.toLocaleString('es-CO')} contratos · año {anio}</p></div>
        <div className="flex flex-wrap gap-2">
          <SelectorAnioSabana anio={anio} sucursal={sucursal} coordinador={coordinadorSeleccionado} coordinadores={(coordinadores ?? []).map((item) => ({ id: item.id, nombre: item.nombre }))} anios={aniosDisponibles()} sucursales={sucursales} bloqueado={usuario.rol !== 'administrador'} />
          <a href={`/admin/sabana/export?${query.toString()}`} className="rounded-xl bg-[#14432A] px-4 py-2 text-sm font-bold text-white">Descargar CSV</a>
          <Link href="/admin" className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">Panel</Link>
        </div>
      </header>
      <div className="overflow-auto rounded-[22px] border bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead><tr className="bg-[#FDC100]"><th className="sticky left-0 bg-[#0C0C0C] px-3 py-2 text-[#FDC100]">Cliente / Contrato</th><th className="px-3 py-2">Coordinador</th>{MESES.map((mes) => <th key={mes} className="px-2 py-2 text-center">{mes}</th>)}</tr></thead>
          <tbody>{[...mapa.values()].map((fila, indice) => <tr key={`${fila.contrato}-${indice}`} className="border-t"><td className="sticky left-0 bg-white px-3 py-2"><b>{fila.cliente}</b><p className="font-mono text-[#6B7280]">{fila.contrato}</p></td><td className="px-3 py-2">{fila.coordinador}<p className="text-[#6B7280]">{fila.sucursal}</p></td>{fila.meses.map((visita, mes) => <td key={mes} className="px-2 py-2 text-center">{visita ? <span className="rounded bg-[#E8F1EC] px-1.5 py-1 font-bold" title={visita.fecha_inicio ?? undefined}>{etiquetaCelda(visita)}</span> : '·'}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

async function cargarContratos(supabase: Awaited<ReturnType<typeof createClient>>, coordinador: string, sucursal: string, _usuarioId: string) {
  let consulta = supabase.from('contratos').select('id, numero, coordinador_id, clientes(nombre, ciudad), usuarios!contratos_coordinador_id_fkey(nombre, sucursal)').eq('activo', true).order('numero');
  if (coordinador) consulta = consulta.eq('coordinador_id', coordinador);
  if (sucursal) {
    const { data: usuariosSucursal, error } = await supabase.from('usuarios').select('id').eq('rol', 'coordinador').eq('sucursal', sucursal).eq('activo', true);
    if (error) return { data: null, error };
    const ids = (usuariosSucursal ?? []).map((item) => item.id);
    if (!ids.length) return { data: [], error: null };
    consulta = consulta.in('coordinador_id', ids);
  }
  return consulta;
}

function etiquetaCelda(visita: Fila) {
  const fecha = visita.fecha_inicio ? String(visita.fecha_inicio).slice(8, 10).replace(/^0/, '') : '';
  const numero = visita.numero_visita ? ` - ${visita.numero_visita}` : '';
  return `${fecha || '•'}${numero}${visita.fue_reprogramada ? ' ↻' : ''}`;
}

function Error({ mensaje }: { mensaje: string }) { return <div className="m-6 rounded-xl border border-[#F6CFCB] bg-[#FEECEC] p-4 text-sm text-[#B42318]"><p className="font-bold">No se pudo cargar la sábana</p><p className="mt-1">{mensaje}</p></div>; }
