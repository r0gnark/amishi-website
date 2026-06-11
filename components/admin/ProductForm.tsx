"use client";

import { useState } from "react";

const CATEGORIES = [
  "mishi-frasco",
  "mishi-flor",
  "mishi-aros",
  "imanes",
  "mishi-kitty",
  "papeleria",
] as const;

export type ProductFormValues = {
  name: string;
  price: number;
  image: string;
  gallery: string[];
  instagramUrl: string;
  description: string;
  category: string;
};

type Props = {
  initial?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel: string;
};

export function ProductForm({ initial = {}, onSubmit, submitLabel }: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [price, setPrice] = useState(String(initial.price ?? ""));
  const [image, setImage] = useState(initial.image ?? "");
  const [gallery, setGallery] = useState((initial.gallery ?? []).join("\n"));
  const [instagramUrl, setInstagramUrl] = useState(
    initial.instagramUrl ?? "https://ig.me/m/amishi.cl"
  );
  const [description, setDescription] = useState(initial.description ?? "");
  const [category, setCategory] = useState(initial.category ?? CATEGORIES[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        name,
        price: Number(price),
        image,
        gallery: gallery.split("\n").map((s) => s.trim()).filter(Boolean),
        instagramUrl,
        description,
        category,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const field = "w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose";
  const label = "block text-sm font-medium text-ink mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="name" className={label}>Nombre *</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </div>

      <div>
        <label htmlFor="price" className={label}>Precio (CLP) *</label>
        <input id="price" type="number" min={0} required value={price} onChange={(e) => setPrice(e.target.value)} className={field} />
      </div>

      <div>
        <label htmlFor="category" className={label}>Categoría *</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="image" className={label}>URL imagen principal *</label>
        <input
          id="image"
          required
          placeholder="/images/productos/categoria/nombre.jpeg"
          pattern="^(/|https?://).*"
          title="Debe empezar con / o http(s)://"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className={field}
        />
      </div>

      <div>
        <label htmlFor="gallery" className={label}>Galería (una URL por línea)</label>
        <textarea id="gallery" rows={3} value={gallery} onChange={(e) => setGallery(e.target.value)} className={field} />
      </div>

      <div>
        <label htmlFor="description" className={label}>Descripción</label>
        <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={field} />
      </div>

      <div>
        <label htmlFor="instagramUrl" className={label}>URL Instagram</label>
        <input id="instagramUrl" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={field} />
      </div>

      {error && <p className="text-sm text-clay" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-clay px-5 py-2 text-sm font-medium text-white hover:bg-rose transition-colors disabled:opacity-60"
      >
        {loading ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
