'use client';

// ============================================================================
// src/app/login/page.tsx  ·  REEMPLAZA el archivo de la Fase 4
//
// Ingreso en dos pasos: correo → código de 6 dígitos. Sin contraseñas.
//
// Google queda detrás de NEXT_PUBLIC_MOSTRAR_GOOGLE:
//   · sin definir o 'true'  → se muestra (red de seguridad mientras pruebas)
//   · 'false'               → desaparece y solo queda el correo
// No lo apagues hasta comprobar que el código llega: si el SMTP no está
// configurado y quitas Google, nadie puede entrar.
// ============================================================================
import { Suspense, useActionState, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { enviarCodigo, type ResultadoLogin } from './acciones';

const MOSTRAR_GOOGLE = process.env.NEXT_PUBLIC_MOSTRAR_GOOGLE !== 'false';
const SEGUNDOS_REENVIO = 45;

function Acceso() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = params.get('destino') || '/';

  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState('');
  const [espera, setEspera] = useState(0);
  const campoCodigo = useRef<HTMLInputElement>(null);

  const [resultado, enviar, enviando] = useActionState<ResultadoLogin | null, FormData>(
    async (previo, formData) => {
      setError('');
      const r = await enviarCodigo(previo, formData);
      if (r.ok) {
        setCorreo(String(formData.get('correo') || '').trim().toLowerCase());
        setPaso('codigo');
        setEspera(SEGUNDOS_REENVIO);
      }
      return r;
    },
    null
  );

  // Cuenta atrás para poder reenviar
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  useEffect(() => {
    if (paso === 'codigo') campoCodigo.current?.focus();
  }, [paso]);

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = codigo.replace(/\D/g, '');
    if (limpio.length !== 6) {
      setError('El código son 6 dígitos.');
      return;
    }

    setVerificando(true);
    setError('');

    const supabase = createClient();
    const { error: errorOtp } = await supabase.auth.verifyOtp({
      email: correo,
      token: limpio,
      type: 'email',
    });

    if (errorOtp) {
      setVerificando(false);
      setError(
        errorOtp.message.toLowerCase().includes('expired')
          ? 'El código expiró. Pide uno nuevo.'
          : 'Código incorrecto. Revísalo e inténtalo otra vez.'
      );
      return;
    }

    // La sesión ya existe. La raíz redirige a cada quien a su módulo según rol.
    router.replace(destino);
    router.refresh();
  }

  async function entrarConGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destino)}`,
        queryParams: { hd: 'kaeser.com', prompt: 'select_account' },
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[25px] border border-[#E4E7EB] bg-white shadow-sm">
        <div className="bg-[#FDC100] px-8 py-7">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0C0C0C]">
            <span className="text-lg font-extrabold text-[#FDC100]">K</span>
          </div>
          <h1 className="text-xl font-extrabold leading-tight tracking-tight text-[#0C0C0C]">PROGRAMADOR</h1>
          <p className="text-sm font-bold tracking-wide text-[#0C0C0C]/70">COORDINADORES KAESER</p>
        </div>

        <div className="px-8 py-7">
          {paso === 'correo' ? (
            <>
              <p className="mb-5 text-sm text-[#6B7280]">
                Escribe tu correo corporativo. Te enviaremos un código de 6 dígitos para entrar.
              </p>

              <form action={enviar} className="space-y-3">
                <input
                  name="correo"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  defaultValue={correo}
                  placeholder="nombre.apellido@kaeser.com"
                  className="w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-4 py-3 text-sm outline-none transition focus:border-[#FDC100] focus:bg-white focus:ring-2 focus:ring-[#FDC100]/25"
                />
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] transition hover:bg-black disabled:opacity-60"
                >
                  {enviando && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#FDC100]/40 border-t-[#FDC100]" />}
                  {enviando ? 'Enviando…' : 'Enviarme el código'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setPaso('correo'); setCodigo(''); setError(''); }}
                className="mb-3 text-xs font-bold text-[#6B7280] underline-offset-2 hover:underline"
              >
                ← Cambiar de correo
              </button>

              <p className="mb-1 text-sm text-[#6B7280]">Escribe el código que enviamos a</p>
              <p className="mb-5 break-all font-mono text-sm font-bold text-[#0C0C0C]">{correo}</p>

              <form onSubmit={verificar} className="space-y-3">
                <input
                  ref={campoCodigo}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  aria-label="Código de 6 dígitos"
                  className="w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.4em] outline-none transition focus:border-[#FDC100] focus:bg-white focus:ring-2 focus:ring-[#FDC100]/25"
                />
                <button
                  type="submit"
                  disabled={verificando || codigo.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0C0C0C] px-4 py-3 font-bold text-[#FDC100] transition hover:bg-black disabled:opacity-50"
                >
                  {verificando && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#FDC100]/40 border-t-[#FDC100]" />}
                  {verificando ? 'Entrando…' : 'Entrar'}
                </button>
              </form>

              <form action={enviar} className="mt-3">
                <input type="hidden" name="correo" value={correo} />
                <button
                  type="submit"
                  disabled={espera > 0 || enviando}
                  className="w-full text-xs font-bold text-[#6B7280] underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
                >
                  {espera > 0 ? `Reenviar código en ${espera} s` : 'Reenviar código'}
                </button>
              </form>
            </>
          )}

          {resultado && paso === 'codigo' && resultado.ok && (
            <p className="mt-4 rounded-xl border border-[#C9E0D3] bg-[#E8F1EC] px-4 py-3 text-sm text-[#14432A]">
              {resultado.mensaje}
            </p>
          )}
          {((resultado && !resultado.ok) || error) && (
            <p className="mt-4 rounded-xl border border-[#F6CFCB] bg-[#FEECEC] px-4 py-3 text-sm text-[#B42318]">
              {error || resultado?.mensaje}
            </p>
          )}

          {MOSTRAR_GOOGLE && paso === 'correo' && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#E9ECEF]" />
                <span className="text-xs font-semibold text-[#6B7280]">o</span>
                <span className="h-px flex-1 bg-[#E9ECEF]" />
              </div>
              <button
                onClick={entrarConGoogle}
                className="w-full rounded-xl border border-[#E4E7EB] bg-white px-4 py-3 text-sm font-bold text-[#0C0C0C] transition hover:bg-[#f8f9fa]"
              >
                Continuar con Google
              </button>
            </>
          )}

          <p className="mt-5 text-center text-xs text-[#6B7280]">
            El acceso está restringido al personal registrado por el administrador.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PaginaLogin() {
  return (
    <Suspense>
      <Acceso />
    </Suspense>
  );
}
