"use client";

import { useEffect, useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { CatalogFilterItem } from "@/data/catalog-filters";

export default function CategoriasPage() {
  const [categories, setCategories] = useState<CatalogFilterItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function loadCategories() {
    fetch("/api/categorias")
      .then((response) => response.json())
      .then(setCategories);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categorias")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setCategories(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setLabel("");
    setImage("");
    setError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!image) {
      setError("Selecciona una fotografía para la categoría");
      return;
    }
    setSaving(true);
    setError("");
    const url = editingId
      ? `/api/admin/categorias/${editingId}`
      : "/api/admin/categorias";
    const response = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, image }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.detail ?? "No se pudo guardar la categoría");
      return;
    }
    resetForm();
    loadCategories();
    window.dispatchEvent(new Event("amishi-categories-changed"));
  }

  async function remove(category: CatalogFilterItem) {
    if (!confirm(`¿Eliminar la categoría "${category.label}"?`)) return;
    const response = await fetch(`/api/admin/categorias/${category.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.detail ?? "No se pudo eliminar la categoría");
      return;
    }
    setCategories((current) => current.filter((item) => item.id !== category.id));
    window.dispatchEvent(new Event("amishi-categories-changed"));
  }

  async function persistOrder(reordered: CatalogFilterItem[]) {
    const previous = categories;
    setCategories(reordered);
    setError("");

    const response = await fetch("/api/admin/categorias/orden", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((item) => item.id) }),
    });
    if (!response.ok) {
      setCategories(previous);
      setError("No se pudo guardar el nuevo orden");
      return;
    }
    window.dispatchEvent(new Event("amishi-categories-changed"));
  }

  function dropOn(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const reordered = [...categories];
    const sourceIndex = reordered.findIndex((item) => item.id === draggedId);
    const targetIndex = reordered.findIndex((item) => item.id === targetId);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDraggedId(null);
    void persistOrder(reordered);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Categorías</h1>
        <p className="mt-1 text-sm text-ink/60">
          Controla los círculos que aparecen sobre el catálogo público.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((category, index) => (
            <article
              key={category.id}
              draggable
              onDragStart={() => setDraggedId(category.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(category.id)}
              className={`cursor-grab rounded-2xl bg-white p-3 shadow-sm transition active:cursor-grabbing ${
                draggedId === category.id ? "scale-95 opacity-50 ring-2 ring-clay" : ""
              }`}
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={category.image} alt={category.label} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-ink shadow-sm">
                  {index + 1}
                </span>
              </div>
              <h2 className="mt-3 font-medium text-ink">{category.label}</h2>
              <p className="text-xs text-ink/50">{category.id}</p>
              <p className="mt-2 text-xs text-ink/50">⋮⋮ Arrastra para cambiar la posición</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  className="text-clay hover:underline"
                  onClick={() => {
                    setEditingId(category.id);
                    setLabel(category.label);
                    setImage(category.image);
                    setError("");
                  }}
                >
                  Editar
                </button>
                <button type="button" className="text-rose hover:underline" onClick={() => remove(category)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>

        <form onSubmit={save} className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl text-ink">
            {editingId ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <div>
            <label htmlFor="categoryLabel" className="mb-1 block text-sm font-medium text-ink">
              Nombre
            </label>
            <input
              id="categoryLabel"
              required
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink">Fotografía</p>
            <MediaPicker selected={image ? [image] : []} onChange={(urls) => setImage(urls[0] ?? "")} />
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <div className="flex gap-2">
            <button disabled={saving} className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white">
              {saving ? "Guardando…" : editingId ? "Guardar" : "Crear categoría"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-lg px-4 py-2 text-sm text-ink hover:bg-cream">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
