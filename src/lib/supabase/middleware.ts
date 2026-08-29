// ============================================================================
// src/lib/supabase/middleware.ts
// Refresca el token de sesión en cada petición y protege las rutas privadas.
//
// @supabase/ssr NECESITA este paso: los Server Components no pueden escribir
// cookies, así que si el token no se renueva aquí, la sesión se cae sola a los
// ~60 minutos y el usuario vuelve a ver la pantalla vacía.
// ============================================================================
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Rutas accesibles sin sesión iniciada */
const RUTAS_PUBLICAS = ['/login', '/auth', '/api'];

export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() valida el token contra Supabase. No uses getSession() aquí:
  // lee la cookie sin verificarla y es falsificable.
  const { data: { user } } = await supabase.auth.getUser();
  const emailDesdeCookie = request.cookies.get('user_email')?.value?.toLowerCase();

  const ruta = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((r) => ruta.startsWith(r));
  const esAccionLogin = request.headers.get('next-action') === 'app/login';

  if (!user && !emailDesdeCookie && !esPublica && !esAccionLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('destino', ruta); // vuelve aquí tras iniciar sesión
    return NextResponse.redirect(url);
  }

  if (user && ruta === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/clientes';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // IMPORTANTE: devolver 'respuesta' tal cual, para no perder las cookies
  // que Supabase acaba de renovar.
  return respuesta;
}
