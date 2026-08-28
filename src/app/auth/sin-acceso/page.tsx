// ============================================================================
// src/app/auth/sin-acceso/page.tsx
// El correo se autenticó en Google pero no está autorizado en 'usuarios'.
// Equivale al "Acceso denegado para: correo" de la app anterior.
// ============================================================================
import Link from 'next/link';

type Props = { searchParams: Promise<{ correo?: string; motivo?: string }> };

export default async function SinAcceso({ searchParams }: Props) {
  const { correo = '', motivo } = await searchParams;
  const inactivo = motivo === 'inactivo';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-md rounded-[25px] border border-[#E4E7EB] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEECEC]">
          <svg className="h-6 w-6 text-[#B42318]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 12.75v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h1 className="mb-2 text-xl font-extrabold text-[#0C0C0C]">
          {inactivo ? 'Usuario inactivo' : 'Acceso no autorizado'}
        </h1>

        <p className="mb-1 text-sm text-[#4B5563]">
          {inactivo
            ? 'Tu usuario existe pero está marcado como inactivo.'
            : 'Este correo no está registrado en el sistema.'}
        </p>
        {correo && (
          <p className="mb-5 font-mono text-sm font-bold text-[#0C0C0C]">{correo}</p>
        )}

        <p className="mb-6 text-sm text-[#6B7280]">
          Solicita al administrador que te agregue en la tabla de usuarios
          con tu sucursal y cargo correspondientes.
        </p>

        <Link
          href="/login"
          className="inline-block rounded-xl bg-[#0C0C0C] px-5 py-3 text-sm font-bold text-[#FDC100] transition hover:bg-black"
        >
          Volver a intentar
        </Link>
      </div>
    </main>
  );
}
