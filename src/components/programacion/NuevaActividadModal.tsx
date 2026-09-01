'use client';

import { useState } from 'react';

export type TipoActividad =
  | 'Reunión'
  | 'Capacitación'
  | 'Permiso'
  | 'Cita médica'
  | 'Actividades personales'
  | 'Vacaciones'
  | 'Incapacidad'
  | 'Servicio puntual';

export interface ActividadLocal {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  tipo: TipoActividad;
  tecnicos: string[];
  nota: string;
}

export default function NuevaActividadModal({
  abierto,
  tecnicos,
  onClose,
  onGuardar,
}: {
  abierto: boolean;
  tecnicos: { id: string; nombre: string }[];
  onClose: () => void;
  onGuardar: (actividad: ActividadLocal) => void;
}) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipo, setTipo] = useState<TipoActividad>('Reunión');
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [nota, setNota] = useState('');

  if (!abierto) return null;

  function toggleTecnico(id: string) {
    setSeleccionados((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  }

  function guardar() {
    if (!fechaInicio) return;
    onGuardar({
      id: `${Date.now()}`,
      fechaInicio,
      fechaFin,
      tipo,
      tecnicos: seleccionados,
      nota,
    });
    setFechaInicio('');
    setFechaFin('');
    setTipo('Reunión');
    setSeleccionados([]);
    setNota('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0C0C]/35 p-4">
      <div className="w-full max-w-2xl rounded-[24px] border border-[#E4E7EB] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-[#6B7280]">Agenda</p>
            <h3 className="text-xl font-extrabold text-[#0C0C0C]">Nueva actividad</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#E4E7EB] px-3 py-1.5 text-sm font-bold text-[#0C0C0C]">
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-bold text-[#4B5563]">
            Fecha inicio
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm outline-none focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25"
            />
          </label>

          <label className="text-sm font-bold text-[#4B5563]">
            Fecha fin
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm outline-none focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25"
            />
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-bold text-[#4B5563]">
            Tipo
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoActividad)}
              className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm outline-none focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25"
            >
              {['Reunión','Capacitación','Permiso','Cita médica','Actividades personales','Vacaciones','Incapacidad','Servicio puntual'].map((opcion) => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-bold text-[#4B5563]">Técnico(s)</legend>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] p-3">
            {tecnicos.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No hay técnicos asignados para este coordinador.</p>
            ) : (
              tecnicos.map((tecnico) => (
                <label key={tecnico.id} className="flex items-center gap-2 text-sm text-[#0C0C0C]">
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(tecnico.id)}
                    onChange={() => toggleTecnico(tecnico.id)}
                  />
                  <span>{tecnico.nombre}</span>
                </label>
              ))
            )}
          </div>
        </fieldset>

        <label className="mt-4 block text-sm font-bold text-[#4B5563]">
          Nota
          <textarea
            rows={4}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Añade observaciones o detalles de la actividad"
            className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-3 py-2 text-sm outline-none focus:border-[#FDC100] focus:ring-2 focus:ring-[#FDC100]/25"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#E4E7EB] bg-white px-4 py-2 text-sm font-bold text-[#0C0C0C]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={!fechaInicio}
            className="rounded-xl bg-[#0C0C0C] px-4 py-2 text-sm font-bold text-[#FDC100] disabled:opacity-50"
          >
            Guardar actividad
          </button>
        </div>
      </div>
    </div>
  );
}
