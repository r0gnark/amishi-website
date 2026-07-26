"use client";

import { useEffect, useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import {
  DEFAULT_SITE_CONTENT,
  type SiteContent,
} from "@/components/SiteContentContext";

export default function ContenidoPage() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/contenido")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setContent({ ...DEFAULT_SITE_CONTENT, ...data });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar los ajustes");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function update<Key extends keyof SiteContent>(
    key: Key,
    value: SiteContent[Key],
  ) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/contenido", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!response.ok) throw new Error("Error al guardar");
      setSuccess(true);
    } catch {
      setError("No se pudieron guardar los ajustes");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose";
  const label = "mb-1 block text-sm font-medium text-ink";

  if (loading) {
    return <p className="text-sm text-clay">Cargando…</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Personalizar sitio</h1>
        <p className="mt-1 text-sm text-ink/60">
          Estos cambios se muestran en la página pública.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-ink">Identidad y anuncio</h2>
          <div>
            <label htmlFor="siteName" className={label}>Nombre del sitio</label>
            <input
              id="siteName"
              value={content.siteName}
              onChange={(event) => update("siteName", event.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="announcementBar" className={label}>
              Barra de anuncio
            </label>
            <input
              id="announcementBar"
              value={content.announcementBar}
              onChange={(event) => update("announcementBar", event.target.value)}
              className={field}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-ink">Sección Sobre</h2>
          <div>
            <label htmlFor="aboutTitle" className={label}>Título</label>
            <input
              id="aboutTitle"
              value={content.aboutTitle}
              onChange={(event) => update("aboutTitle", event.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="about" className={label}>Texto</label>
            <textarea
              id="about"
              rows={8}
              value={content.about}
              onChange={(event) => update("about", event.target.value)}
              className={field}
            />
          </div>
          <div>
            <p className={label}>Imagen</p>
            <MediaPicker
              selected={content.aboutImage ? [content.aboutImage] : []}
              onChange={(urls) => update("aboutImage", urls[0] ?? "")}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-ink">Contacto y redes</h2>
          <div>
            <label htmlFor="contactLabel" className={label}>
              Texto del enlace de contacto
            </label>
            <input
              id="contactLabel"
              value={content.contactLabel}
              onChange={(event) => update("contactLabel", event.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="contactUrl" className={label}>
              Enlace de contacto
            </label>
            <input
              id="contactUrl"
              type="url"
              value={content.contactUrl}
              onChange={(event) => update("contactUrl", event.target.value)}
              className={field}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="instagramHandle" className={label}>
                Usuario de Instagram
              </label>
              <input
                id="instagramHandle"
                value={content.instagramHandle}
                onChange={(event) => update("instagramHandle", event.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="instagramProfileUrl" className={label}>
                URL del perfil
              </label>
              <input
                id="instagramProfileUrl"
                type="url"
                value={content.instagramProfileUrl}
                onChange={(event) =>
                  update("instagramProfileUrl", event.target.value)
                }
                className={field}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-ink">Pie de página</h2>
          <div>
            <label htmlFor="footerText" className={label}>Descripción</label>
            <textarea
              id="footerText"
              rows={3}
              value={content.footerText}
              onChange={(event) => update("footerText", event.target.value)}
              className={field}
            />
          </div>
        </section>

        {error && <p className="text-sm text-rose" role="alert">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">
            Ajustes guardados correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-clay px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar y publicar cambios"}
        </button>
      </form>
    </div>
  );
}
