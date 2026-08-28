// ============================================================================
// Ficha del cliente + cronograma (Server Component)
// TODO en UNA sola consulta anidada: contrato → cliente → visitas → técnicos.
// En la app anterior esto exigía leer la hoja completa y cruzar en memoria.
// ============================================================================
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { ContratoDetalle, Visita } from '@/types/db';
import {
  formatearPeriodo, formatearFecha, formatearHora,
  ETIQUETA_ESTADO, CLASES_ESTADO, BORDE_ESTADO,
  ETIQUETA_MATERIAL, CLASES_MATERIAL, colorDesdeTexto, iniciales,
} from '@/lib/formato';

export default async function FichaContrato({ contratoId }: { contratoId: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contratos')
    .select(`
      id, numero, asesor, valido_desde, valido_hasta,
      clientes ( nombre, codigo_cliente, ciudad, direccion, nombre_contacto, telefono_contacto, correo_cliente ),
      visitas (
        id, periodo, numero_visita, estado, fecha_inicio, fecha_fin,
        hora_inicio, hora_fin, os, confirmacion, observaciones,
        estado_materiales, detalle_materiales, union_pendiente_periodo,
        visita_tecnicos ( tecnicos ( id, nombre, correo, cedula, placa ) )
      )
    `)
    .eq('id', contratoId)
    .order('periodo', { referencedTable: 'visitas', ascending: true })
    .single<ContratoDetalle>();

  if (error || !data) {
    return (
      <div className="m-6 rounded-xl border border-[#F6CFCB] bg-[#FEECEC] p-4 text-sm text-[#B42318]">
        <p className="font-bold">No se pudo cargar la ficha</p>
        <p className="mt-1">{error?.message ?? 'Contrato no encontrado o sin permiso.'}</p>
      </div>
    );
  }

  const cli = data.clientes;
  const nombre = cli?.nombre ?? 'Sin nombre';
  const visitas = data.visitas ?? [];

  // Aviso de vencimiento (misma regla que la alerta de la hoja: columna K)
  const hoy = new Date().toISOString().slice(0, 10);
  const vencido = data.valido_hasta ? data.valido_hasta < hoy : false;

  return (
    <div className="p-6 md:p-8">
      {/* ---------- Encabezado ---------- */}
      <header className="mb-6 rounded-[22px] border border-[#E4E7EB] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] text-3xl font-extrabold text-white"
            style={{ backgroundColor: colorDesdeTexto(nombre) }}
            aria-hidden
          >
            {iniciales(nombre)}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-[#0C0C0C]">{nombre}</h2>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-1 font-mono text-sm text-[#6B7280]">
                Contrato <b className="text-[#0C0C0C]">{data.numero}</b>
              </span>
              {cli?.codigo_cliente && (
                <span className="rounded-lg border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-1 font-mono text-sm text-[#6B7280]">
                  Cód. {cli.codigo_cliente}
                </span>
              )}
              {data.valido_hasta && (
                <span className={`rounded-lg border px-3 py-1 text-xs font-bold
                  ${vencido ? 'border-[#F6CFCB] bg-[#FEECEC] text-[#B42318]'
                            : 'border-[#C9E0D3] bg-[#E8F1EC] text-[#14432A]'}`}>
                  {vencido ? 'Contrato vencido' : 'Vigente'} · hasta {formatearFecha(data.valido_hasta)}
                </span>
              )}
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-[#4B5563] md:grid-cols-2">
              <Dato etiqueta="Contacto" valor={cli?.nombre_contacto} />
              <Dato etiqueta="Teléfono" valor={cli?.telefono_contacto} />
              <Dato etiqueta="Correo" valor={cli?.correo_cliente} />
              <Dato etiqueta="Ciudad" valor={cli?.ciudad} />
              <div className="md:col-span-2">
                <Dato etiqueta="Dirección" valor={cli?.direccion} />
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* ---------- Cronograma ---------- */}
      <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-[#0C0C0C]">
        Cronograma de Mantenimiento
        <span className="rounded-full bg-[#E9ECEF] px-2 py-0.5 text-xs font-bold text-[#475061]">
          {visitas.length}
        </span>
      </h3>

      {visitas.length === 0 ? (
        <p className="italic text-[#6B7280]">Este contrato no tiene visitas en el cronograma.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visitas.map((v) => <TarjetaVisita key={v.id} visita={v} contratoId={data.id} />)}
        </div>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-semibold text-[#6B7280]">{etiqueta}:</dt>
      <dd className="min-w-0 truncate">{valor || '—'}</dd>
    </div>
  );
}

function TarjetaVisita({ visita: v, contratoId }: { visita: Visita; contratoId: string }) {
  const tecnicos = (v.visita_tecnicos ?? [])
    .map((vt) => vt.tecnicos?.nombre)
    .filter(Boolean) as string[];

  return (
    <Link href={`?contrato=${contratoId}&visita=${v.id}`} scroll={false}
      className={`flex flex-col rounded-[22px] border border-l-[5px] border-[#E4E7EB] bg-white p-5 shadow-sm transition hover:shadow-md ${BORDE_ESTADO[v.estado]}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h4 className="text-[0.95rem] font-bold text-[#0C0C0C]">
          Visita {v.numero_visita ?? '—'} / {formatearPeriodo(v.periodo)}
        </h4>
        <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-wide ${CLASES_ESTADO[v.estado]}`}>
          {ETIQUETA_ESTADO[v.estado]}
        </span>
      </div>

      <dl className="flex-1 space-y-1.5 text-sm text-[#4B5563]">
        <Linea etiqueta="Técnicos" valor={tecnicos.length ? tecnicos.join(', ') : 'Sin asignar'} />
        <Linea
          etiqueta="Fecha"
          valor={
            v.fecha_inicio
              ? formatearFecha(v.fecha_inicio) +
                (v.fecha_fin && v.fecha_fin !== v.fecha_inicio ? ` → ${formatearFecha(v.fecha_fin)}` : '')
              : 'Por definir'
          }
        />
        {(v.hora_inicio || v.hora_fin) && (
          <Linea etiqueta="Horario" valor={`${formatearHora(v.hora_inicio)} – ${formatearHora(v.hora_fin)}`} />
        )}
        <Linea etiqueta="OS" valor={v.os ?? '---'} mono />

        <div className="flex items-center gap-2 pt-0.5">
          <dt className="font-semibold text-[#6B7280]">Materiales:</dt>
          <dd className={`rounded-md px-2 py-0.5 text-[0.7rem] font-extrabold uppercase ${CLASES_MATERIAL[v.estado_materiales]}`}>
            {ETIQUETA_MATERIAL[v.estado_materiales]}
          </dd>
        </div>

        {v.detalle_materiales && (
          <p className="whitespace-pre-wrap pt-1 text-xs text-[#6B7280]">{v.detalle_materiales}</p>
        )}
      </dl>

      {v.union_pendiente_periodo && (
        <p className="mt-3 rounded-xl border border-[#F7D9BC] bg-[#FFF1E4] px-3 py-2 text-xs font-bold text-[#B54708]">
          Pendiente unir con la visita reprogramada de {formatearPeriodo(v.union_pendiente_periodo)}
        </p>
      )}
    </Link>
  );
}

function Linea({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-semibold text-[#6B7280]">{etiqueta}:</dt>
      <dd className={`min-w-0 ${mono ? 'font-mono' : ''}`}>{valor}</dd>
    </div>
  );
}
