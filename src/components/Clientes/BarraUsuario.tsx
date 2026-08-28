// ============================================================================
// src/components/BarraUsuario.tsx  (Server Component)
// Muestra quién está conectado y su rol. Colócalo en el layout.
// Sirve además para verificar de un vistazo que el RLS aplica el rol correcto.
// ============================================================================
import { createClient } from '@/lib/supabase/server';
import CerrarSesion from './CerrarSesion';

const ETIQUETA_ROL: Record<string, string> = {
  administrador: 'Administrador',
  coordinador: 'Coordinador',
  service_logistician: 'Service Logistician',
};

export default async function BarraUsuario() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: fila } = await supabase
    .from('usuarios')
    .select('nombre, rol, sucursal')
    .eq('correo', user.email ?? '')
    .maybeSingle();

  return (
    <div className="flex items-center gap-3 border-b border-[#E4E7EB] bg-white px-6 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0C0C0C] text-sm font-bold text-[#FDC100]">
        {(fila?.nombre ?? user.email ?? '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-bold text-[#0C0C0C]">
          {fila?.nombre ?? user.email}
        </p>
        <p className="truncate text-xs text-[#6B7280]">
          {ETIQUETA_ROL[fila?.rol ?? ''] ?? 'Sin rol'}
          {fila?.sucursal ? ` · ${fila.sucursal}` : ''}
        </p>
      </div>
      <CerrarSesion />
    </div>
  );
}
