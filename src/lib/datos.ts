import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
export interface TecnicoBasico { id: string; nombre: string; correo: string | null; cedula: string | null; placa: string | null; }
export const obtenerTecnicos = cache(async (): Promise<TecnicoBasico[]> => { const { data } = await (await createClient()).from('tecnicos').select('id, nombre, correo, cedula, placa').eq('activo', true).order('nombre'); return (data ?? []) as TecnicoBasico[]; });
export const obtenerCoordinadores = cache(async (): Promise<{ id: string; nombre: string }[]> => { const { data } = await (await createClient()).from('usuarios').select('id, nombre').eq('rol', 'coordinador').eq('activo', true).order('nombre'); return data ?? []; });
export const obtenerFestivos = unstable_cache(async (): Promise<{ fecha: string; nombre: string }[]> => { const { data } = await (await createClient()).from('festivos').select('fecha, nombre').order('fecha'); return data ?? []; }, ['festivos'], { revalidate: 86400, tags: ['festivos'] });
