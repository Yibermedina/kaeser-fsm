'use server';

// ============================================================================
// src/app/login/acciones.ts
// Envío del código de 6 dígitos.
//
// Se hace en el servidor (no desde el navegador) para poder comprobar ANTES
// que el correo esté autorizado, y así no gastar envíos ni crear usuarios en
// auth.users que después no podrían entrar.
// ============================================================================

import { createClient } from '@/lib/supabase/server';

export interface ResultadoLogin {
  ok: boolean;
  mensaje: string;
}

/**
 * Mensaje deliberadamente genérico: no revela si el correo existe o no.
 * Evita que alguien use la pantalla para averiguar quién trabaja aquí.
 */
const MENSAJE_NEUTRO =
  'Si el correo está registrado, en unos segundos recibirás un código de 8 dígitos.';

export async function enviarCodigo(
  _anterior: ResultadoLogin | null,
  formData: FormData
): Promise<ResultadoLogin> {
  const correo = String(formData.get('correo') || '').trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { ok: false, mensaje: 'Escribe un correo válido.' };
  }

  const supabase = await createClient();

  // ¿Está autorizado? (función SECURITY DEFINER: solo devuelve true/false)
  const { data: autorizado, error: errorRpc } = await supabase
    .rpc('correo_autorizado', { p_correo: correo });

  if (errorRpc) {
    return { ok: false, mensaje: `No se pudo validar el correo: ${errorRpc.message}` };
  }

  // No autorizado: se responde igual que si lo estuviera, pero no se envía nada.
  if (!autorizado) {
    return { ok: true, mensaje: MENSAJE_NEUTRO };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: correo,
    options: {
      // true porque en el primer ingreso la persona todavía no existe en
      // auth.users. Solo llegamos aquí si ya está autorizada en 'usuarios'.
      shouldCreateUser: true,
    },
  });

  if (error) {
    // El más habitual: superar el límite de envíos por hora.
    if (error.message.toLowerCase().includes('rate')) {
      return { ok: false, mensaje: 'Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.' };
    }
    return { ok: false, mensaje: `No se pudo enviar el código: ${error.message}` };
  }

  return { ok: true, mensaje: MENSAJE_NEUTRO };
}
