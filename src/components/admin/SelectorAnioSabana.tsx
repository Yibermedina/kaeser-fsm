'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export default function SelectorAnioSabana({ anio, sucursal, coordinador, coordinadores, anios, sucursales, bloqueado }: { anio: number; sucursal: string; coordinador: string; coordinadores: { id: string; nombre: string }[]; anios: number[]; sucursales: string[]; bloqueado: boolean }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [pendiente, iniciar] = useTransition();
	function actualizar(clave: string, valor: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (valor) params.set(clave, valor); else params.delete(clave);
		iniciar(() => router.replace(`${pathname}?${params}`, { scroll: false }));
	}
	return <div className="flex flex-wrap items-center gap-2">
		<select value={anio} onChange={(e) => actualizar('anio', e.target.value)} aria-label="Año" className="rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm font-semibold">{anios.map((a) => <option key={a} value={a}>{a}</option>)}</select>
		<select value={sucursal} onChange={(e) => actualizar('sucursal', e.target.value)} aria-label="Sucursal" disabled={bloqueado} className="rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm font-semibold disabled:bg-[#f8f9fa]"><option value="">Todas las sucursales</option>{sucursales.map((s) => <option key={s} value={s}>{s}</option>)}</select>
		{!bloqueado && <select value={coordinador} onChange={(e) => actualizar('coordinador', e.target.value)} aria-label="Coordinador" className="rounded-xl border border-[#E4E7EB] bg-white px-3 py-2 text-sm font-semibold"><option value="">Todos los coordinadores</option>{coordinadores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select>}
		{pendiente && <span aria-label="Cargando" className="h-4 w-4 animate-spin rounded-full border-2 border-[#E9ECEF] border-t-[#FDC100]" />}
	</div>;
}
