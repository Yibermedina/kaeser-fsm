'use client';

// ============================================================================
// Buscador. Único componente de cliente de la vista.
// Mantiene el debounce de 200 ms de la app actual, pero ahora no re-renderiza
// 2.426 tarjetas: solo cambia la URL y el servidor devuelve la página filtrada.
// useTransition evita que la lista "parpadee" mientras llegan los resultados.
// ============================================================================
import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function BuscadorClientes({ valorInicial }: { valorInicial: string }) {
  const [texto, setTexto] = useState(valorInicial);
  const [pendiente, iniciarTransicion] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const primeraVez = useRef(true);

  useEffect(() => {
    // No dispares una navegación en el primer render.
    if (primeraVez.current) { primeraVez.current = false; return; }

    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (texto.trim()) params.set('q', texto.trim());
      else params.delete('q');
      params.delete('pagina');          // toda búsqueda nueva vuelve a la página 1
      iniciarTransicion(() => router.replace(`${pathname}?${params}`, { scroll: false }));
    }, 200);

    return () => clearTimeout(t);
  }, [texto, pathname, router, searchParams]);

  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]"
           fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>

      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por cliente o número de contrato..."
        aria-label="Buscar clientes"
        className="w-full rounded-xl border border-[#E4E7EB] bg-[#f8f9fa] py-2.5 pl-9 pr-9 text-sm
                   outline-none transition focus:border-[#FDC100] focus:bg-white
                   focus:ring-2 focus:ring-[#FDC100]/25"
      />

      {pendiente && (
        <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin
                         rounded-full border-2 border-[#E9ECEF] border-t-[#FDC100]"
              aria-label="Buscando" />
      )}
    </div>
  );
}
