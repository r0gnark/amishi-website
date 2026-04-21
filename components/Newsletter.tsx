"use client";

import { useState, type FormEvent } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sent");
    setEmail("");
  }

  return (
    <section
      id="newsletter"
      className="bg-blush/35 py-14 md:py-16"
      aria-labelledby="newsletter-titulo"
    >
      <div className="mx-auto max-w-xl px-4 text-center">
        <h2 id="newsletter-titulo" className="font-display text-2xl font-semibold text-ink md:text-3xl">
          Mail club creativo
        </h2>
        <p className="mt-3 text-sm text-ink/80">
          Deja tu correo para enterarte de lanzamientos y talleres.{" "}
          <span className="text-ink/60">(Sin backend aún — solo demostración.)</span>
        </p>

        {status === "sent" ? (
          <p
            className="mt-6 rounded-2xl border border-rose/40 bg-white/80 px-4 py-4 text-sm font-medium text-clay"
            role="status"
          >
            ¡Pronto! Esta casilla es solo de muestra — conecta Formspree o tu proveedor cuando
            quieras recibir suscriptores de verdad.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center"
          >
            <label htmlFor="email-newsletter" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="email-newsletter"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-12 flex-1 rounded-full border border-rose/40 bg-white px-5 text-ink placeholder:text-ink/40 focus:border-clay focus:ring-2 focus:ring-rose"
            />
            <button
              type="submit"
              className="min-h-12 rounded-full bg-ink px-8 text-sm font-semibold text-cream transition hover:bg-ink/90"
            >
              Unirme
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
