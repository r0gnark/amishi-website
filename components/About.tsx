export function About() {
  return (
    <section
      id="sobre"
      className="border-b border-rose/10 bg-white py-14 md:py-20"
      aria-labelledby="sobre-titulo"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-rose/30 bg-gradient-to-br from-blush via-rose/30 to-cream shadow-inner">
          {/* TODO: reemplazar por foto real del taller o de la marca */}
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <span className="text-7xl" aria-hidden>
              💖
            </span>
            <p className="mt-6 font-display text-2xl text-ink">Amishi</p>
            <p className="mt-2 text-sm text-ink/75">Placeholder visual — sube tu foto aquí</p>
          </div>
        </div>

        <div>
          <h2 id="sobre-titulo" className="font-display text-3xl font-semibold text-ink md:text-4xl">
            Bienvenid@ a Amishi
          </h2>
          <p className="mt-6 leading-relaxed text-ink/85">
            Amishi nace del amor por el diseño, los gatos y la cerámica. Cada pieza cuenta una
            pequeña historia: un desayuno lento, un rincón ilustrado, un ronroneo de fondo.
          </p>
          <p className="mt-4 leading-relaxed text-ink/85">
            Trabajo en ediciones reducidas y con mucha atención al detalle. Si te gusta lo
            artesanal, lo tierno y un poco de caos felino, estás en el lugar correcto.
          </p>
        </div>
      </div>
    </section>
  );
}
