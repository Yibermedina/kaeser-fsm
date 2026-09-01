'use client';

import { useMemo, useState } from 'react';
import NuevaActividadModal, { type ActividadLocal } from './NuevaActividadModal';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function AgendaSemanal({ tecnicos }: { tecnicos: { id: string; nombre: string }[] }) {
  const [abierto, setAbierto] = useState(false);
  const [actividades, setActividades] = useState<ActividadLocal[]>([]);

  const semana = useMemo(() => {
    const inicio = new Date();
    const lunes = new Date(inicio);
    const dia = inicio.getDay();
    const offset = (dia === 0 ? -6 : 1 - dia);
    lunes.setDate(inicio.getDate() + offset);
    lunes.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      return { nombre: DIAS[i], iso: fecha.toISOString().slice(0, 10) };
    });
  }, []);

  function guardarActividad(actividad: ActividadLocal) {
    setActividades((prev) => [...prev, actividad]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[#E4E7EB] bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#0C0C0C]">Agenda operativa</h2>
          <p className="text-sm text-[#6B7280]">Vista semanal por técnico</p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="rounded-xl bg-[#0C0C0C] px-4 py-2 text-sm font-bold text-[#FDC100]"
        >
          + Nueva actividad
        </button>
      </div>

      <div className="overflow-auto rounded-[22px] border border-[#E4E7EB] bg-white shadow-sm">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead className="bg-[#f8f9fa]">
            <tr>
              <th className="border-b border-[#E4E7EB] px-3 py-3 font-extrabold uppercase text-[#6B7280]">Día</th>
              {tecnicos.map((tecnico) => (
                <th key={tecnico.id} className="border-b border-[#E4E7EB] px-3 py-3 font-extrabold uppercase text-[#6B7280]">{tecnico.nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {semana.map((dia) => (
              <tr key={dia.iso} className="align-top">
                <td className="border-b border-[#E4E7EB] bg-[#f8f9fa] px-3 py-3 font-bold text-[#0C0C0C]">
                  <div>{dia.nombre}</div>
                  <div className="mt-1 text-[0.65rem] text-[#6B7280]">{dia.iso}</div>
                </td>
                {tecnicos.map((tecnico) => {
                  const items = actividades.filter(
                    (actividad) => actividad.tecnicos.includes(tecnico.id) && (actividad.fechaInicio <= dia.iso && (!actividad.fechaFin || actividad.fechaFin >= dia.iso))
                  );
                  return (
                    <td key={`${dia.iso}-${tecnico.id}`} className="border-b border-[#E4E7EB] px-2 py-2 align-top">
                      <div className="space-y-2">
                        {items.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-[#E4E7EB] p-2 text-[0.62rem] text-[#9CA3AF]">Sin actividad</div>
                        ) : (
                          items.map((item) => (
                            <div key={item.id} className="rounded-lg border border-[#E4E7EB] bg-[#FFF7DB] p-2 text-[0.62rem] text-[#0C0C0C]">
                              <p className="font-extrabold">{item.tipo}</p>
                              <p>{item.fechaInicio}{item.fechaFin ? ` → ${item.fechaFin}` : ''}</p>
                              {item.nota && <p className="mt-1 text-[#475061]">{item.nota}</p>}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NuevaActividadModal
        abierto={abierto}
        tecnicos={tecnicos}
        onClose={() => setAbierto(false)}
        onGuardar={guardarActividad}
      />
    </div>
  );
}
