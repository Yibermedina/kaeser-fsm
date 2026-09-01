import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requerirAcceso } from '@/lib/sesion';
import FormularioContrato from '@/components/materiales/FormularioContrato';
import ContratosMasiva from '@/components/materiales/ContratosMasiva';
import { hoyIso } from '@/lib/fechas';

export const dynamic = 'force-dynamic';
export interface ContratoAdmin { id: string; numero: string; activo: boolean; plantilla_materiales: string | null; valido_hasta: string | null; clientes: { nombre: string; ciudad: string | null } | null; usuarios: { nombre: string } | null; }

export default async function AdminContratos({ searchParams }: { searchParams: Promise<{ q?: string; nuevo?: string; vencidos?: string }> }) {
  await requerirAcceso('/materiales');
  const { q = '', nuevo, vencidos } = await searchParams;
  const hoy = hoyIso();
  const supabase = await createClient();
  const { data: coordinadores } = await supabase.from('usuarios').select('id, nombre').eq('rol', 'coordinador').eq('activo', true).order('nombre');

  let consulta = supabase.from('contratos').select('id, numero, activo, plantilla_materiales, valido_hasta, clientes(nombre, ciudad), usuarios(nombre)').order('activo', { ascending: false }).order('numero').limit(200);

  if (q) consulta = consulta.ilike('numero', `%${q.replace(/[%,()]/g, ' ').trim()}%`);
  if (vencidos === '1') consulta = consulta.lt('valido_hasta', hoy);

  const { data, error } = await consulta;
  const contratos = (data ?? []) as unknown as ContratoAdmin[];

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 md:p-6">
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Contratos</h1>
            <p className="text-sm text-[#6B7280]">Alta de contratos, cronograma y plantilla de materiales</p>
          </div>
          <Link href="/materiales" className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">Centro de materiales</Link>
        </header>

        <FormularioContrato coordinadores={coordinadores ?? []} abiertoInicial={nuevo === '1'} />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <form className="flex flex-1 gap-2">
            <input name="q" defaultValue={q} placeholder="Buscar por número" className="flex-1 rounded-xl border bg-white px-4 py-2" />
            <button className="rounded-xl border bg-white px-4 py-2 font-bold">Buscar</button>
          </form>
          <Link href="/materiales/contratos?vencidos=1" className={`rounded-xl px-4 py-2 text-sm font-bold ${vencidos === '1' ? 'bg-[#0C0C0C] text-[#FDC100]' : 'border bg-white'}`}>
            Contratos vencidos
          </Link>
          {vencidos === '1' && (
            <Link href="/materiales/contratos" className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">
              Ver todos
            </Link>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-[#FEECEC] p-4 text-sm text-[#B42318]">{error.message}</p>
        ) : (
          <ContratosMasiva contratos={contratos} vistaVencidos={vencidos === '1'} />
        )}
      </div>
    </main>
  );
}

