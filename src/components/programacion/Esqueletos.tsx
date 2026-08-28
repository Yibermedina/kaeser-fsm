const brillo = 'animate-pulse rounded-lg bg-[#ECEEF1]';

export function EsqueletoRejilla() {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#E4E7EB] bg-white" aria-busy="true" aria-label="Cargando calendario">
      <div className="border-b border-[#E4E7EB] px-4 py-2.5"><div className={`${brillo} h-3 w-56`} /></div>
      <div className="grid grid-cols-7 border-b border-[#E4E7EB] bg-[#f8f9fa]">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="px-2 py-2"><div className={`${brillo} mx-auto h-3 w-8`} /></div>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[118px] border-b border-r border-[#EEF0F2] p-1.5">
            <div className={`${brillo} mb-2 h-3 w-4`} />
            {i % 3 === 0 && <div className={`${brillo} mb-1 h-7 w-full`} />}
            {i % 5 === 0 && <div className={`${brillo} h-7 w-full`} />}
          </div>
        ))}
      </div>
    </section>
  );
}
