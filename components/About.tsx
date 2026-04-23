import { BrandLogo } from "./BrandLogo";

export function About() {
  return (
    <section
      id="sobre"
      className="border-b border-rose/10 bg-white py-14 md:py-20"
      aria-labelledby="sobre-titulo"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-amishi-disk">
          <div className="flex h-full items-center justify-center p-8">
            <BrandLogo variant="about" siteName="Amishi" alt="Amishi — logo" />
          </div>
        </div>

        <div>
          <h2 id="sobre-titulo" className="font-display text-3xl font-semibold text-ink md:text-4xl">
            Bienvenid@ a Amishi
          </h2>
          <p className="mt-6 leading-relaxed text-ink/85">
            Un rincón creado para quienes aman los gatos y los pequeños detalles. Aquí todo nace
            desde el cariño por el diseño y por los mishi.
          </p>
          <p className="mt-4 leading-relaxed text-ink/85">
            Cada pieza está hecha a mano, con tiempo y dedicación, por eso ninguna es igual a otra.
            Trabajo en ediciones limitadas, cuidando cada detalle.
          </p>
          <p className="mt-4 leading-relaxed text-ink/85">
            Si eres loc@ por ellos… este lugar también es para ti.
          </p>
          <p className="mt-4 leading-relaxed text-ink/85">
            Puedes conocer más en mis redes{" "}
            <a
              href="https://www.instagram.com/amishi.cl/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-clay underline decoration-rose/40 underline-offset-2 hover:text-rose"
            >
              @amishi.cl
            </a>
            {" · "}
            <a
              href="https://www.instagram.com/holi.javi/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-clay underline decoration-rose/40 underline-offset-2 hover:text-rose"
            >
              @holi.javi
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
