'use client';

// ============================================================================
// src/components/CerrarSesion.tsx
// router.refresh() obliga a los Server Components a re-renderizarse ya sin
// sesión; sin él, la interfaz seguiría mostrando datos en caché.
// ============================================================================
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CerrarSesion() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      disabled={saliendo}
      className="shrink-0 rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-xs font-bold
                 text-[#4B5563] transition hover:bg-[#f8f9fa] disabled:opacity-60"
    >
      {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  );
}
