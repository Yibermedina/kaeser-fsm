// ============================================================================
// src/app/clientes/page.tsx  ·  Directorio de Clientes (Server Component)
//
// Diseño de rendimiento (lo contrario a la app en Sheets):
//   · Ninguna de las 2.426 filas se descarga al navegador "por si acaso".
//     La lista se pagina en el servidor y la búsqueda la resuelve Postgres.
//   · Los dos paneles se transmiten por separado con <Suspense>: la lista se
//     pinta apenas está lista, sin esperar a la ficha.
//   · El estado vive en la URL (?q=&contrato=), así que es compartible,
//     sobrevive al refresco y permite navegación instantánea de Next.
// ============================================================================
import { Suspense } from 'react';
import BuscadorClientes from '@/components/Clientes/BuscadorClientes';
import ListaContratos from '@/components/Clientes/ListaContratos';
import FichaContrato from '@/components/Clientes/FichaContrato';
import { EsqueletoLista, EsqueletoFicha } from '@/components/Clientes/Esqueletos';
import { requerirAcceso } from '@/lib/sesion';
import PanelVisita from '@/components/programacion/PanelVisita';
import { obtenerTecnicos } from '@/lib/datos';

export const dynamic = 'force-dynamic'; // los datos dependen de la sesión (RLS)

type Props = {
  searchParams: Promise<{ q?: string; contrato?: string; pagina?: string; visita?: string; mes?: string; anio?: string; estado?: string }>;
};

export default async function PaginaClientes({ searchParams }: Props) {
  await requerirAcceso('/clientes');
  // En Next.js 15 searchParams es una promesa.
  const { q = '', contrato = '', pagina = '1', visita = '', mes = '', anio = '', estado = '' } = await searchParams;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      {/* ---------- Panel izquierdo: directorio ---------- */}
      <aside className="flex w-[34%] min-w-[320px] flex-col border-r border-[#E4E7EB] bg-white">
        <div className="border-b border-[#E4E7EB] p-4">
          <h1 className="mb-3 text-lg font-extrabold tracking-tight text-[#0C0C0C]">
            Directorio de Clientes
          </h1>
          <BuscadorClientes valorInicial={q} />
          <form className="mt-3 grid grid-cols-3 gap-2" method="GET">
            <select name="mes" defaultValue={mes} className="rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm">
              <option value="">Mes</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
            <select name="anio" defaultValue={anio} className="rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm">
              <option value="">Año</option>
              {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select name="estado" defaultValue={estado} className="rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm">
              <option value="">Estado</option>
              <option value="vigente">Vigente</option>
              <option value="vencido">Vencido</option>
            </select>
            <button type="submit" className="col-span-3 rounded-xl bg-[#0C0C0C] px-3 py-2 text-sm font-bold text-[#FDC100]">
              Aplicar filtros
            </button>
          </form>
        </div>

        {/* key: al cambiar la búsqueda se remonta y vuelve a mostrar el esqueleto */}
        <Suspense key={`${q}-${pagina}-${mes}-${anio}-${estado}`} fallback={<EsqueletoLista />}>
          <ListaContratos q={q} pagina={Number(pagina) || 1} contratoActivo={contrato} mes={mes} anio={anio} estado={estado} />
        </Suspense>
      </aside>

      {/* ---------- Panel derecho: ficha ---------- */}
      <section className="flex-1 overflow-y-auto">
        {contrato ? (
          <Suspense key={contrato} fallback={<EsqueletoFicha />}>
            <FichaContrato contratoId={contrato} />
          </Suspense>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-[#6B7280]">
            <svg className="mb-4 h-16 w-16 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.4 9.4 0 002.625.372 9.3 9.3 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.3 12.3 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-lg font-semibold">Selecciona un cliente del directorio</p>
          </div>
        )}
      </section>
      {visita && (
        <Suspense fallback={null}>
          <PanelVisita visitaId={visita} tecnicos={await obtenerTecnicos()} />
        </Suspense>
      )}
    </div>
  );
}
