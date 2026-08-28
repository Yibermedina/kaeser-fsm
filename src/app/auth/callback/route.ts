import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function destinoSeguro(request: Request): string {
  const destino = new URL(request.url).searchParams.get('next');
  return destino && destino.startsWith('/') && !destino.startsWith('//')
    ? destino
    : '/clientes';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const destino = destinoSeguro(request);

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=sin_codigo', request.url));
  }

  const supabase = await createClient();
  const { error: intercambioError } = await supabase.auth.exchangeCodeForSession(code);

  if (intercambioError) {
    return NextResponse.redirect(new URL('/login?error=sesion_invalida', request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  const correo = user?.email?.trim().toLowerCase();

  if (!correo) {
    return NextResponse.redirect(new URL('/login?error=correo_invalido', request.url));
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('activo')
    .eq('correo', correo)
    .maybeSingle<{ activo: boolean }>();

  if (usuarioError || !usuario) {
    const url = new URL('/auth/sin-acceso', request.url);
    url.searchParams.set('correo', correo);
    return NextResponse.redirect(url);
  }

  if (!usuario.activo) {
    const url = new URL('/auth/sin-acceso', request.url);
    url.searchParams.set('correo', correo);
    url.searchParams.set('motivo', 'inactivo');
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(destino, request.url));
}
