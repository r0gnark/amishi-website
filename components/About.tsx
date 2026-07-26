"use client";

import { useSiteContent } from "./SiteContentContext";

export function About() {
  const {
    aboutTitle,
    about,
    aboutImage,
    instagramHandle,
    instagramProfileUrl,
  } = useSiteContent();

  return (
    <section
      id="sobre"
      className="border-b border-rose/10 bg-white py-14 md:py-20"
      aria-labelledby="sobre-titulo"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:items-center">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-cream">
          {/* La imagen se selecciona desde la biblioteca del administrador. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={aboutImage}
            alt={aboutTitle}
            className="h-full w-full object-contain"
          />
        </div>

        <div>
          <h2
            id="sobre-titulo"
            className="font-display text-3xl font-semibold text-ink md:text-4xl"
          >
            {aboutTitle}
          </h2>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-ink/85">
            {about}
          </p>
          <p className="mt-4 leading-relaxed text-ink/85">
            Puedes conocer más en mis redes{" "}
            <a
              href={instagramProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-clay underline decoration-rose/40 underline-offset-2 hover:text-rose"
            >
              {instagramHandle}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
