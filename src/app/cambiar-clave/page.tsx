'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CambiarClave() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get('destino') || '/clientes';
  const code = params.get('code');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [sesionLista, setSesionLista] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const manejarCodigo = async () => {
      const codigo = params.get('code');
      const hash = window.location.hash || '';
      const accesoToken = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash).get('access_token');
      const codigoDisponible = codigo || accesoToken;

      if (!codigoDisponible) {
        const { data: { session } } = await supabase.auth.getSession();
        setSesionLista(Boolean(session));
        return;
      }

      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codigoDisponible);
        if (exchangeError) {
          setError(exchangeError.message);
          setSesionLista(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setSesionLista(Boolean(session));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo preparar la sesión para cambiar la contraseña.');
        setSesionLista(false);
      }
    };

    void manejarCodigo();
  }, [params]);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setError(''); setMensaje('');
    if (clave.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (clave !== confirmacion) { setError('Las contraseñas no coinciden.'); return; }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('La sesión no está activa. Reintenta desde el enlace de recuperación.');
      return;
    }

    setCargando(true);
    const { error: cambioError } = await supabase.auth.updateUser({ password: clave });
    setCargando(false);
    if (cambioError) { setError(cambioError.message); return; }
    setMensaje('Contraseña actualizada.');
    setTimeout(() => router.replace(destino), 500);
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4"><form onSubmit={guardar} className="w-full max-w-md space-y-4 rounded-[25px] border border-[#E4E7EB] bg-white p-8 shadow-sm"><h1 className="text-xl font-extrabold text-[#0C0C0C]">Cambia tu contraseña</h1><p className="text-sm text-[#6B7280]">Por seguridad, define una contraseña personal antes de continuar.</p>{code && !sesionLista && <p className="rounded-xl bg-[#FFF7DB] p-3 text-sm text-[#8A6A00]">Preparando la sesión de recuperación…</p>}<label className="block text-sm font-bold">Nueva contraseña<input type="password" required minLength={8} autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E4E7EB] px-3 py-2" /></label><label className="block text-sm font-bold">Confirmar contraseña<input type="password" required minLength={8} autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E4E7EB] px-3 py-2" /></label>{error && <p className="rounded-xl bg-[#FEECEC] p-3 text-sm text-[#B42318]" role="alert">{error}</p>}{mensaje && <p className="rounded-xl bg-[#E8F1EC] p-3 text-sm text-[#14432A]" role="status">{mensaje}</p>}<button type="submit" disabled={cargando || (code !== null && !sesionLista)} className="w-full rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] disabled:opacity-60">{cargando ? 'Guardando…' : 'Guardar contraseña'}</button></form></main>;
}
