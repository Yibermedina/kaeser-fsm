'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cambiarEstadoContrato, eliminarContrato, programacionMasiva, type ResultadoAccion } from '@/app/materiales/contratos/acciones';
import type { ContratoAdmin } from '@/app/materiales/contratos/page';

export default function ContratosMasiva({ contratos, vistaVencidos = false }: { contratos: ContratoAdmin[]; vistaVencidos?: boolean }) {
  const router = useRouter();
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [fechaVisita, setFechaVisita] = useState('');
  const [estado, setEstado] = useState<'programado' | 'pendiente'>('programado');
  const [mensaje, setMensaje] = useState<ResultadoAccion | null>(null);
  const [pendiente, iniciar] = useTransition();

  const toggle = (id: string) => {
    setSeleccionados((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const aplicarMasiva = () => {
    if (!seleccionados.length || !fechaVisita) {
      setMensaje({ ok: false, mensaje: 'Selecciona al menos un contrato y una fecha de visita.' });
      return;
    }

    const formData = new FormData();
    seleccionados.forEach((id) => formData.append('contratos', id));
    formData.set('fechaVisita', fechaVisita);
    formData.set('estado', estado);

    iniciar(async () => {
      const resultado = await programacionMasiva(formData);
      setMensaje(resultado);
      if (resultado.ok) {
        setSeleccionados([]);
        setFechaVisita('');
        router.refresh();
      }
    });
  };

  const cambiarActivo = async (id: string, activo: boolean) => {
    iniciar(async () => {
      const resultado = await cambiarEstadoContrato(id, activo);
      setMensaje(resultado);
      if (resultado.ok) router.refresh();
    });
  };

  const borrar = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este contrato?')) return;
    iniciar(async () => {
      const resultado = await eliminarContrato(id);
      setMensaje(resultado);
      if (resultado.ok) router.refresh();
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-[22px] border border-[#E4E7EB] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1 text-sm font-bold text-[#4B5563]">
            Fecha de visita
            <input
              type="date"
              value={fechaVisita}
              onChange={(e) => setFechaVisita(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm outline-none focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25"
            />
          </label>
          <label className="text-sm font-bold text-[#4B5563]">
            Estado
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as 'programado' | 'pendiente')}
              className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm outline-none focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25"
            >
              <option value="programado">Programado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </label>
          <button
            type="button"
            onClick={aplicarMasiva}
            disabled={pendiente || !seleccionados.length || !fechaVisita}
            className="rounded-xl bg-[#0C0C0C] px-4 py-2 text-sm font-bold text-[#FDC100] disabled:opacity-50"
          >
            Programación/Actualización Masiva
          </button>
        </div>
      </div>

      {mensaje && (
        <p className={`rounded-xl border px-4 py-3 text-sm ${mensaje.ok ? 'border-[#C9E0D3] bg-[#E8F1EC] text-[#14432A]' : 'border-[#F6CFCB] bg-[#FEECEC] text-[#B42318]'}`}>
          {mensaje.mensaje}
        </p>
      )}

      <div className="overflow-x-auto rounded-[22px] border border-[#E4E7EB] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8f9fa] text-[0.7rem] font-extrabold uppercase tracking-wide text-[#6B7280]">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={contratos.length > 0 && seleccionados.length === contratos.length}
                  onChange={(e) => setSeleccionados(e.target.checked ? contratos.map((c) => c.id) : [])}
                  aria-label="Seleccionar todos"
                />
              </th>
              <th className="px-4 py-3">Contrato y cliente</th>
              <th className="px-4 py-3">Coordinador</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#6B7280]">
                  {vistaVencidos ? 'No hay contratos vencidos en este momento.' : 'No hay contratos para mostrar.'}
                </td>
              </tr>
            ) : (
              contratos.map((contrato) => (
                <tr key={contrato.id} className={`border-t ${!contrato.activo ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(contrato.id)}
                      onChange={() => toggle(contrato.id)}
                      aria-label={`Seleccionar ${contrato.numero}`}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-bold text-[#0C0C0C]">{contrato.clientes?.nombre ?? 'Sin cliente'}</p>
                    <p className="font-mono text-xs text-[#6B7280]">CTR {contrato.numero}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-[#4B5563]">{contrato.usuarios?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 align-top font-mono text-xs text-[#4B5563]">
                    {contrato.valido_hasta ? contrato.valido_hasta : 'Sin fecha'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => cambiarActivo(contrato.id, !contrato.activo)}
                        className="rounded-lg border border-[#E4E7EB] bg-white px-2.5 py-1.5 text-[0.7rem] font-bold text-[#0C0C0C]"
                      >
                        {contrato.activo ? 'Suspender' : 'Reactivar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => borrar(contrato.id)}
                        className="rounded-lg bg-[#FEECEC] px-2.5 py-1.5 text-[0.7rem] font-bold text-[#B42318]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
