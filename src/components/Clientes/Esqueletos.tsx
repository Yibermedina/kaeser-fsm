// ============================================================================
// Skeletons de carga. Se muestran mientras <Suspense> espera la consulta,
// así el usuario nunca ve una pantalla congelada (el reclamo de la app actual).
// ============================================================================

const brillo = 'animate-pulse rounded-lg bg-[#ECEEF1]';

export function EsqueletoLista() {
  return (
    <div className="flex-1 space-y-1 overflow-hidden p-4" aria-busy="true" aria-label="Cargando clientes">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className={`${brillo} h-11 w-11 rounded-full`} />
          <div className="flex-1 space-y-2">
            <div className={`${brillo} h-3.5 w-3/5`} />
            <div className={`${brillo} h-3 w-2/5`} />
          </div>
          <div className={`${brillo} h-6 w-16`} />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoFicha() {
  return (
    <div className="p-6 md:p-8" aria-busy="true" aria-label="Cargando ficha">
      <div className="mb-6 flex gap-5 rounded-[22px] border border-[#E4E7EB] bg-white p-6">
        <div className={`${brillo} h-20 w-20 rounded-[22px]`} />
        <div className="flex-1 space-y-3">
          <div className={`${brillo} h-6 w-2/5`} />
          <div className={`${brillo} h-4 w-1/4`} />
          <div className={`${brillo} h-4 w-3/5`} />
        </div>
      </div>
      <div className={`${brillo} mb-4 h-5 w-64`} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${brillo} h-44 rounded-[22px]`} />
        ))}
      </div>
    </div>
  );
}
