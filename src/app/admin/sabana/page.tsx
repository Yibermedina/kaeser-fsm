import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requerirAcceso } from '@/lib/sesion';
import { aniosDisponibles, hoyIso } from '@/lib/fechas';
import SelectorAnioSabana from '@/components/admin/SelectorAnioSabana';

export const dynamic = 'force-dynamic';
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const POR_PAGINA = 60;
type Fila = { visita_id: string; contrato_id: string; contrato: string; cliente: string; ciudad: string | null; coordinador: string | null; sucursal: string; periodo: string; numero_visita: string | null; estado: string; fue_reprogramada: boolean };

type Props = { searchParams: Promise<{ anio?: string; sucursal?: string; pagina?: string }> };
export default async function VistaSabana({ searchParams }: Props) {
  await requerirAcceso('/admin');
  const p = await searchParams; const anio = Number(p.anio) || Number(hoyIso().slice(0, 4)); const sucursal = p.sucursal ?? ''; const pagina = Math.max(1, Number(p.pagina) || 1); const desde = (pagina - 1) * POR_PAGINA; const supabase = await createClient();
  const { data: contratosPagina, count, error: contratosError } = await supabase.from('vista_directorio').select('contrato_id, contrato_numero, cliente_nombre, ciudad', { count: 'exact' }).order('cliente_nombre').range(desde, desde + POR_PAGINA - 1);
  if (contratosError) return <Error mensaje={contratosError.message} />;
  const ids = (contratosPagina ?? []).map((c) => c.contrato_id as string);
  const [{ data: visitas, error: visitasError }, { data: sucursalesData }] = await Promise.all([
    ids.length ? supabase.from('vista_sabana').select('*').in('contrato_id', ids).gte('periodo', `${anio}-01-01`).lte('periodo', `${anio}-12-01`) : Promise.resolve({ data: [], error: null }),
    supabase.from('vista_sabana').select('sucursal').limit(500),
  ]);
  if (visitasError) return <Error mensaje={visitasError.message} />;
  const filas = (visitas ?? []) as Fila[]; const filtradas = sucursal ? filas.filter((f) => f.sucursal === sucursal) : filas;
  const mapa = new Map<string, { contrato: string; cliente: string; ciudad: string | null; coordinador: string | null; sucursal: string; meses: (Fila | undefined)[] }>();
  for (const fila of filtradas) { const actual = mapa.get(fila.contrato_id) ?? { contrato: fila.contrato, cliente: fila.cliente, ciudad: fila.ciudad, coordinador: fila.coordinador, sucursal: fila.sucursal, meses: Array(12).fill(undefined) }; actual.meses[Number(fila.periodo.slice(5, 7)) - 1] = fila; mapa.set(fila.contrato_id, actual); }
  const sucursales = [...new Set((sucursalesData ?? []).map((f) => f.sucursal as string))].sort(); const totalPaginas = Math.max(1, Math.ceil((count ?? 0) / POR_PAGINA)); const enlace = (n: number) => `/admin/sabana?${new URLSearchParams({ anio: String(anio), ...(sucursal ? { sucursal } : {}), pagina: String(n) })}`;
  return <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-6"><header className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-extrabold">Vista sábana</h1><p className="text-sm text-[#6B7280]">{count ?? 0} contratos · página {pagina} de {totalPaginas} · año {anio}</p></div><div className="flex flex-wrap gap-2"><SelectorAnioSabana anio={anio} sucursal={sucursal} anios={aniosDisponibles()} sucursales={sucursales} /><a href={`/admin/sabana/export?anio=${anio}${sucursal ? `&sucursal=${encodeURIComponent(sucursal)}` : ''}`} className="rounded-xl bg-[#14432A] px-4 py-2 text-sm font-bold text-white">Descargar CSV</a><Link href="/admin" className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">Panel</Link></div></header><div className="overflow-auto rounded-[22px] border bg-white shadow-sm"><table className="w-full border-collapse text-left text-xs"><thead><tr className="bg-[#FDC100]"><th className="sticky left-0 bg-[#0C0C0C] px-3 py-2 text-[#FDC100]">Cliente / Contrato</th><th className="px-3 py-2">Coordinador</th>{MESES.map((mes) => <th key={mes} className="px-2 py-2 text-center">{mes}</th>)}</tr></thead><tbody>{[...mapa.values()].map((fila, i) => <tr key={`${fila.contrato}-${i}`} className="border-t"><td className="sticky left-0 bg-white px-3 py-2"><b>{fila.cliente}</b><p className="font-mono text-[#6B7280]">{fila.contrato}</p></td><td className="px-3 py-2">{fila.coordinador ?? '—'}<p className="text-[#6B7280]">{fila.sucursal}</p></td>{fila.meses.map((visita, indice) => <td key={indice} className="px-2 py-2 text-center">{visita ? <span className="rounded bg-[#E8F1EC] px-1.5 py-1 font-bold">{visita.numero_visita ?? '•'}{visita.fue_reprogramada ? ' ↻' : ''}</span> : '·'}</td>)}</tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between"><span />{pagina > 1 ? <Link href={enlace(pagina - 1)} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">← Anterior</Link> : <span />}{pagina < totalPaginas ? <Link href={enlace(pagina + 1)} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">Siguiente →</Link> : <span />}</div></div>;
}
function Error({ mensaje }: { mensaje: string }) { return <div className="m-6 rounded-xl border border-[#F6CFCB] bg-[#FEECEC] p-4 text-sm text-[#B42318]"><p className="font-bold">No se pudo cargar la sábana</p><p className="mt-1">{mensaje}</p></div>; }
