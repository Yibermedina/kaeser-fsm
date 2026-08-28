'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RecuperarClave() {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviarEnlace(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const email = correo.trim().toLowerCase();
    setError('');
    setMensaje('');
    setCargando(true);

    const supabase = createClient();
    const { error: recuperacionError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/cambiar-clave',
    });

    setCargando(false);
    if (recuperacionError) {
      setError('No se pudo enviar el enlace. Verifica el correo e inténtalo de nuevo.');
      return;
    }
    setMensaje('Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
      <form onSubmit={enviarEnlace} className="w-full max-w-md space-y-4 rounded-[25px] border border-[#E4E7EB] bg-white p-8 shadow-sm">
        <h1 className="text-xl font-extrabold text-[#0C0C0C]">Recuperar contraseña</h1>
        <p className="text-sm text-[#6B7280]">Escribe tu correo corporativo y te enviaremos un enlace para crear una nueva contraseña.</p>
        <label className="block text-sm font-bold text-[#41454D]">
          Correo
          <input type="email" required autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre.apellido@kaeser.com" className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-4 py-3 font-normal outline-none focus:border-[#FDC100] focus:bg-white focus:ring-2 focus:ring-[#FDC100]/25" />
        </label>
        {error && <p className="rounded-xl border border-[#F6CFCB] bg-[#FEECEC] p-3 text-sm text-[#B42318]" role="alert">{error}</p>}
        {mensaje && <p className="rounded-xl border border-[#C9E0D3] bg-[#E8F1EC] p-3 text-sm text-[#14432A]" role="status">{mensaje}</p>}
        <button type="submit" disabled={cargando} className="w-full rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] disabled:opacity-60">
          {cargando ? 'Enviando enlace…' : 'Enviar enlace'}
        </button>
        <Link href="/login" className="block text-center text-sm font-bold text-[#4B5563] underline underline-offset-2">Volver al inicio de sesión</Link>
      </form>
    </main>
  );
}
