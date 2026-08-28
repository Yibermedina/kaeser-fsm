export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export interface Celda {
  iso: string;
  dia: number;
  delMes: boolean;
  esHoy: boolean;
  finDeSemana: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (a: number, m: number, d: number) => `${a}-${pad(m)}-${pad(d)}`;

export function hoyIso(): string {
  const f = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return `${f.getUTCFullYear()}-${pad(f.getUTCMonth() + 1)}-${pad(f.getUTCDate())}`;
}

export function rangoMes(anio: number, mes: number) {
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return { primerDia: iso(anio, mes, 1), ultimoDia: iso(anio, mes, ultimoDia) };
}

export function mesRelativo(anio: number, mes: number, delta: number) {
  const total = anio * 12 + (mes - 1) + delta;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

export function construirRejilla(anio: number, mes: number): Celda[][] {
  const hoy = hoyIso();
  const diasMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const primerDiaSemana = (new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay() + 6) % 7;
  const anterior = mesRelativo(anio, mes, -1);
  const siguiente = mesRelativo(anio, mes, 1);
  const diasMesAnterior = new Date(Date.UTC(anterior.anio, anterior.mes, 0)).getUTCDate();
  const celdas: Celda[] = [];

  for (let i = primerDiaSemana; i > 0; i--) {
    celdas.push(crear(anterior.anio, anterior.mes, diasMesAnterior - i + 1, false, hoy));
  }
  for (let d = 1; d <= diasMes; d++) celdas.push(crear(anio, mes, d, true, hoy));
  let d = 1;
  while (celdas.length % 7 !== 0 || celdas.length < 42) {
    celdas.push(crear(siguiente.anio, siguiente.mes, d++, false, hoy));
    if (celdas.length >= 42) break;
  }

  const semanas: Celda[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

function crear(anio: number, mes: number, dia: number, delMes: boolean, hoy: string): Celda {
  const fecha = iso(anio, mes, dia);
  const diaSemana = (new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay() + 6) % 7;
  return { iso: fecha, dia, delMes, esHoy: fecha === hoy, finDeSemana: diaSemana >= 5 };
}

export function aniosDisponibles(): number[] {
  const actual = Number(hoyIso().slice(0, 4));
  const desde = Math.min(2024, actual - 1);
  return Array.from({ length: 2034 - desde }, (_, i) => desde + i);
}
