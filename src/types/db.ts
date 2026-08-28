// ============================================================================
// Tipos del dominio FSM. Cuando quieras generarlos automáticamente:
//   npx supabase gen types typescript --project-id TU_ID > src/types/supabase.ts
// ============================================================================

export type EstadoVisita = 'pendiente' | 'programado' | 'ejecutado' | 'reprogramada';
export type EstadoMaterial = 'pendiente' | 'preparado' | 'faltante' | 'ajustado';
export type Confirmacion = 'pendiente' | 'confirmado' | 'reprogramar' | 'rechazado';

/** Fila de la vista SQL vista_directorio */
export interface FilaDirectorio {
  contrato_id: string;
  contrato_numero: string;
  cliente_nombre: string;
  codigo_cliente: string | null;
  ciudad: string | null;
  valido_hasta: string | null;
  visitas_pendientes: number;
  visitas_total: number;
}

export interface Tecnico {
  id: string;
  nombre: string;
  correo: string | null;
  cedula: string | null;
  placa: string | null;
}

export interface Visita {
  id: string;
  periodo: string;              // 'YYYY-MM-01'
  numero_visita: string | null; // '1', '1-I', '2-3'
  estado: EstadoVisita;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  hora_inicio: string | null;   // 'HH:MM:SS'
  hora_fin: string | null;
  os: string | null;
  confirmacion: Confirmacion;
  observaciones: string | null;
  estado_materiales: EstadoMaterial;
  detalle_materiales: string | null;
  union_pendiente_periodo: string | null;
  visita_tecnicos: { tecnicos: Tecnico | null }[];
}

export interface ContratoDetalle {
  id: string;
  numero: string;
  asesor: string | null;
  valido_desde: string | null;
  valido_hasta: string | null;
  clientes: {
    nombre: string;
    codigo_cliente: string | null;
    ciudad: string | null;
    direccion: string | null;
    nombre_contacto: string | null;
    telefono_contacto: string | null;
    correo_cliente: string | null;
  } | null;
  visitas: Visita[];
}

/** Fila de la vista SQL vista_calendario (Fase 5) */
export interface FilaCalendario {
  visita_id: string;
  contrato_id: string;
  periodo: string;
  numero_visita: string | null;
  estado: EstadoVisita;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  os: string | null;
  confirmacion: Confirmacion;
  estado_materiales: EstadoMaterial;
  observaciones: string | null;
  union_pendiente_periodo: string | null;
  contrato_numero: string;
  coordinador_id: string | null;
  cliente_nombre: string;
  ciudad: string | null;
  direccion: string | null;
  tecnicos_nombres: string[];
  tecnicos_ids: string[];
  detalle_materiales: string | null;
  coordinador_nombre: string | null;
}
