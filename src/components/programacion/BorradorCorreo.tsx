'use client';

import { useMemo, useState } from 'react';
import { construirCorreoCliente, enlaceMailto, type DatosCorreo } from '@/lib/correo';
export default function BorradorCorreo({ datos, correoCliente }: { datos: Omit<DatosCorreo, 'notasAdicionales'>; correoCliente: string | null }) {
  const [abierto, setAbierto] = useState(false); const [notas, setNotas] = useState(''); const [copiado, setCopiado] = useState(false);
  const { asunto, cuerpo } = useMemo(() => construirCorreoCliente({ ...datos, notasAdicionales: notas }), [datos, notas]);
  const texto = `Asunto: ${asunto}\n\n${cuerpo}`;
  async function copiar() { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { setCopiado(false); } }
  if (!abierto) return <button type="button" onClick={() => setAbierto(true)} className="w-full rounded-xl border border-[#C9E0D3] bg-[#E8F1EC] px-4 py-2.5 text-sm font-bold text-[#14432A]">✉ Preparar correo al cliente</button>;
  return <div className="rounded-xl border border-[#C9E0D3] bg-[#E8F1EC] p-3"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-extrabold text-[#14432A]">Borrador para el cliente</p><button type="button" onClick={() => setAbierto(false)} className="text-xs font-bold underline">Cerrar</button></div><textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Notas adicionales (opcional)" className="mb-2 w-full rounded-lg border border-[#C9E0D3] bg-white px-3 py-2 text-sm" /><pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs">{texto}</pre><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={copiar} className="rounded-lg bg-[#14432A] px-3 py-2 text-xs font-bold text-white">{copiado ? '✓ Copiado' : 'Copiar texto'}</button><a href={enlaceMailto(correoCliente, asunto, cuerpo)} className="rounded-lg border border-[#C9E0D3] bg-white px-3 py-2 text-xs font-bold text-[#14432A]">Abrir en el correo</a></div></div>;
}
