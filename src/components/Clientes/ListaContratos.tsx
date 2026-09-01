// ============================================================================
// Lista del directorio (Server Component · se ejecuta en el servidor)
// Consulta paginada a la vista SQL. Nunca llegan al navegador más de 50 filas.
// ============================================================================
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { FilaDirectorio } from '@/types/db';
import { colorDesdeTexto, iniciales } from '@/lib/formato';

const POR_PAGINA = 50;

export default async function ListaContratos({
  q, pagina, contratoActivo, mes, anio, estado,
}: { q: string; pagina: number; contratoActivo: string; mes?: string; anio?: string; estado?: string }) {
  const supabase = await createClient();
  const desde = (pagina - 1) * POR_PAGINA;

  let consulta = supabase
    .from('vista_directorio')
    .select('contrato_id, contrato_numero, cliente_nombre, codigo_cliente, ciudad, valido_hasta, visitas_pendientes, visitas_total',
            { count: 'exact' })
    .order('cliente_nombre', { ascending: true })
    .range(desde, desde + POR_PAGINA - 1);

  if (mes && /^\d+$/.test(mes)) {
    const mesNum = Number(mes);
    if (mesNum >= 1 && mesNum <= 12) {
      const anioNum = Number(anio) || new Date().getFullYear();
      const fechaInicial = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
      const ultimoDia = new Date(Date.UTC(anioNum, mesNum, 0)).getUTCDate();
      const fechaFinal = `${anioNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
      consulta = consulta.gte('valido_hasta', fechaInicial).lte('valido_hasta', fechaFinal);
    }
  }

  if (estado === 'vencido') consulta = consulta.lt('valido_hasta', new Date().toISOString().slice(0, 10));
  if (estado === 'vigente') consulta = consulta.gte('valido_hasta', new Date().toISOString().slice(0, 10));

  if (q) {
    // Busca por nombre de cliente O por número de contrato.
    // El índice GIN trigram de la Fase 1 acelera el ilike sobre clientes.nombre.
    const seguro = q.replace(/[%,()]/g, ' ').trim();
    consulta = consulta.or(`cliente_nombre.ilike.%${seguro}%,contrato_numero.ilike.%${seguro}%`);
  }

  const { data, count, error } = await consulta;

  if (error) {
    return (
      <div className="m-4 rounded-xl border border-[#F6CFCB] bg-[#FEECEC] p-4 text-sm text-[#B42318]">
        <p className="font-bold">No se pudo cargar el directorio</p>
        <p className="mt-1">{error.message}</p>
      </div>
    );
  }

  const filas = (data ?? []) as FilaDirectorio[];

  if (!filas.length) {
    return (
      <div className="p-6 text-center text-sm italic text-[#6B7280]">
        {q ? `Sin resultados para «${q}».` : 'No hay clientes visibles para tu usuario.'}
      </div>
    );
  }

  const total = count ?? 0;
  const hayMas = desde + filas.length < total;

  return (
    <div className="flex-1 overflow-y-auto">
      <p className="px-4 py-2 text-xs font-semibold text-[#6B7280]">
        {total.toLocaleString('es-CO')} contrato{total === 1 ? '' : 's'}
        {q && ' encontrados'}
      </p>

      <ul>
        {filas.map((f) => {
          const activo = f.contrato_id === contratoActivo;
          return (
            <li key={f.contrato_id}>
              {/* Link => navegación cliente de Next: no recarga la página */}
              <Link
                href={`/clientes?${new URLSearchParams({ ...(q && { q }), ...(pagina > 1 && { pagina: String(pagina) }), contrato: f.contrato_id })}`}
                scroll={false}
                aria-current={activo ? 'true' : undefined}
                className={`flex w-full items-center gap-3 border-b border-l-4 border-[#F1F2F4] px-4 py-3 text-left transition
                  ${activo ? 'border-l-[#FDC100] bg-[#FFF7DB]' : 'border-l-transparent hover:bg-[#f8f9fa]'}`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: colorDesdeTexto(f.cliente_nombre) }}
                  aria-hidden
                >
                  {iniciales(f.cliente_nombre)}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.95rem] font-bold text-[#0C0C0C]">
                    {f.cliente_nombre}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs text-[#6B7280]">
                    CTR {f.contrato_numero}{f.ciudad ? ` · ${f.ciudad}` : ''}
                  </span>
                </span>

                <span className="shrink-0 rounded-lg border border-[#DDE1E6] bg-[#E9ECEF] px-2.5 py-1 text-[0.7rem] font-extrabold uppercase text-[#475061]">
                  {f.visitas_pendientes} pend.
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Paginación: mantiene la búsqueda y el contrato seleccionado */}
      {(pagina > 1 || hayMas) && (
        <div className="flex items-center justify-between gap-2 p-4">
          {pagina > 1 ? (
            <Link href={`/clientes?${new URLSearchParams({ ...(q && { q }), pagina: String(pagina - 1), ...(contratoActivo && { contrato: contratoActivo }) })}`}
                  className="rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-xs font-bold hover:bg-[#f8f9fa]">
              ← Anterior
            </Link>
          ) : <span />}
          <span className="text-xs text-[#6B7280]">Página {pagina}</span>
          {hayMas ? (
            <Link href={`/clientes?${new URLSearchParams({ ...(q && { q }), pagina: String(pagina + 1), ...(contratoActivo && { contrato: contratoActivo }) })}`}
                  className="rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-xs font-bold hover:bg-[#f8f9fa]">
              Siguiente →
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}
