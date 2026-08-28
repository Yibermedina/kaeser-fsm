'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function Formulario() {
  const params = useSearchParams();
  const destino = params.get('destino') || '/clientes';
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function iniciarSesion(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError('');
    const supabase = createClient();
    const { data, error: accesoError } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password: clave,
    });
    if (accesoError || !data.user) {
      setError('Correo o contraseña incorrectos.');
      setCargando(false);
      return;
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('activo')
      .eq('correo', correo.trim().toLowerCase())
      .maybeSingle<{ activo: boolean }>();

    if (usuarioError || !usuario) {
      await supabase.auth.signOut();
      setError('Este correo no está registrado en el sistema.');
      setCargando(false);
      return;
    }

    if (!usuario.activo) {
      await supabase.auth.signOut();
      setError('Tu usuario está inactivo. Contacta al administrador.');
      setCargando(false);
      return;
    }

    const siguiente = data.user.user_metadata?.requiere_cambio_clave
      ? `/cambiar-clave?destino=${encodeURIComponent(destino)}`
      : destino;
    window.location.assign(siguiente);
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
          <p className="text-sm text-[#6B7280]">Ingresa con tu correo corporativo y contraseña.</p>
          <label className="block text-sm font-bold text-[#41454D]">Correo
            <input type="email" required autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre.apellido@kaeser.com" className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-4 py-3 font-normal outline-none focus:border-[#FDC100] focus:bg-white focus:ring-2 focus:ring-[#FDC100]/25" />
          </label>
          <label className="block text-sm font-bold text-[#41454D]">Contraseña
            <input type="password" required autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-4 py-3 font-normal outline-none focus:border-[#FDC100] focus:bg-white focus:ring-2 focus:ring-[#FDC100]/25" />
          </label>
          {error && <p className="rounded-xl border border-[#F6CFCB] bg-[#FEECEC] px-4 py-3 text-sm text-[#B42318]" role="alert">{error}</p>}
          <button type="submit" disabled={cargando} className="w-full rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] transition hover:bg-black disabled:opacity-60">{cargando ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
          <Link href="/recuperar-clave" className="block text-center text-sm font-bold text-[#4B5563] underline underline-offset-2 hover:text-[#0C0C0C]">
            ¿Olvidaste tu contraseña?
          </Link>
        </form>
      </div>
    </main>
  );
}

export default function PaginaLogin() { return <Suspense><Formulario /></Suspense>; }
