'use client';

import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function Formulario() {
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function iniciarSesion(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const email = correo.trim().toLowerCase();
    if (!email) {
      setError('Ingresa tu correo corporativo.');
      return;
    }

    setCargando(true);
    setError('');
    setMensaje('');

    const supabase = createClient();
    const { error: accesoError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://mantenimiento-fsm.com',
      },
    });

    setCargando(false);

    if (accesoError) {
      setError('No se pudo enviar el enlace de acceso. Inténtalo de nuevo.');
      return;
    }

    setMensaje('Revisa tu correo corporativo para entrar al sistema.');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[25px] border border-[#E4E7EB] bg-white shadow-sm">
        <div className="bg-[#FDC100] px-8 py-7">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0C0C0C] text-lg font-extrabold text-[#FDC100]">K</div>
          <h1 className="text-xl font-extrabold leading-tight text-[#0C0C0C]">PROGRAMADOR</h1>
          <p className="text-sm font-bold tracking-wide text-[#0C0C0C]/70">COORDINADORES KAESER</p>
        </div>
        <form onSubmit={iniciarSesion} className="space-y-4 px-8 py-7">
          <p className="text-sm text-[#6B7280]">Ingresa con tu correo corporativo y te enviaremos un enlace de acceso.</p>
          <label className="block text-sm font-bold text-[#41454D]">Correo
            <input type="email" required autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre.apellido@kaeser.com" className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-4 py-3 font-normal outline-none focus:border-[#FDC100] focus:bg-white focus:ring-2 focus:ring-[#FDC100]/25" />
          </label>
          {error && <p className="rounded-xl border border-[#F6CFCB] bg-[#FEECEC] px-4 py-3 text-sm text-[#B42318]" role="alert">{error}</p>}
          {mensaje && <p className="rounded-xl border border-[#C9E0D3] bg-[#E8F1EC] px-4 py-3 text-sm text-[#14432A]" role="status">{mensaje}</p>}
          <button type="submit" disabled={cargando} className="w-full rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] transition hover:bg-black disabled:opacity-60">{cargando ? 'Enviando enlace…' : 'Enviar enlace de acceso'}</button>
        </form>
      </div>
    </main>
  );
}

export default function PaginaLogin() { return <Suspense><Formulario /></Suspense>; }
