"use client";

import { useEffect, useState } from "react";

export default function ContenidoPage() {
  const [about, setAbout] = useState("");
  const [bar, setBar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/contenido")
      .then((r) => r.json())
      .then((data) => {
        setAbout(data.about ?? "");
        setBar(data.announcementBar ?? "");
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contenido", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about, announcementBar: bar }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setSuccess(true);
    } catch {
      setError("No se pudo guardar el contenido");
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose";
  const label = "block text-sm font-medium text-ink mb-1";

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-display text-2xl text-ink">Contenido del sitio</h1>

      {loading ? (
        <p className="text-sm text-clay">Cargando…</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="bar" className={label}>Barra de anuncio</label>
              <input
                id="bar"
                value={bar}
                onChange={(e) => setBar(e.target.value)}
                placeholder="Ej: Envíos a todo Chile"
                className={field}
              />
            </div>

            <div>
              <label htmlFor="about" className={label}>Sección About</label>
              <textarea
                id="about"
                rows={6}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className={field}
              />
            </div>

            {error && <p className="text-sm text-clay" role="alert">{error}</p>}
            {success && <p className="text-sm text-green-600">Guardado correctamente.</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-clay px-5 py-2 text-sm font-medium text-white hover:bg-rose transition-colors disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
