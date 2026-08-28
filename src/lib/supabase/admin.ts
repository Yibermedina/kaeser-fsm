import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient solo debe ejecutarse en servidor. No se usa en componentes cliente.');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const urlValida = Boolean(url && url !== 'undefined' && url !== 'null' && url.trim() !== '');
  const serviceRoleKeyValida = Boolean(serviceRoleKey && serviceRoleKey !== 'undefined' && serviceRoleKey !== 'null' && serviceRoleKey.trim() !== '');

  if (!urlValida || !serviceRoleKeyValida) {
    console.error('Validación de entorno Supabase admin:', {
      url: url ? url.slice(0, 40) : null,
      hasServiceRoleKey: serviceRoleKeyValida,
      serviceRoleKeyPreview: serviceRoleKey ? `${serviceRoleKey.slice(0, 4)}...` : null,
    });
    throw new Error('Falta o está vacía la configuración del cliente admin de Supabase (NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
