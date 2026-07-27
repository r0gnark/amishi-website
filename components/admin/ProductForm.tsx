"use client";

import { useState } from "react";
import { useCategories } from "../CategoryContext";
import { MediaPicker } from "./MediaPicker";

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

function ImagePreview({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="overflow-hidden rounded-xl border border-blush bg-cream">
      <div className="aspect-square">
        {failed ? (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-rose">
            No se pudo cargar esta imagen
          </div>
        ) : (
          // Las URLs son administrables y pueden pertenecer a cualquier dominio.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
            onLoad={() => setFailed(false)}
          />
        )}
      </div>
      <figcaption className="truncate border-t border-blush px-2 py-1.5 text-xs text-ink/60">
        {label}
      </figcaption>
    </figure>
  );
}

export function ProductForm({ initial = {}, onSubmit, submitLabel }: Props) {
  const categories = useCategories();
  const [name, setName] = useState(initial.name ?? "");
  const [price, setPrice] = useState(String(initial.price ?? ""));
  const [image, setImage] = useState(initial.image ?? "");
  const [gallery, setGallery] = useState(initial.gallery ?? []);
  const [instagramUrl, setInstagramUrl] = useState(
    initial.instagramUrl ?? "https://ig.me/m/amishi.cl"
  );
  const [description, setDescription] = useState(initial.description ?? "");
  const [category, setCategory] = useState(initial.category ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!image) {
      setError("Selecciona o sube una imagen principal");
      return;
    }
    const selectedCategory = category || categories[0]?.id;
    if (!selectedCategory) {
      setError("Crea una categoría antes de guardar el producto");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name,
        price: Number(price),
        image,
        gallery,
        instagramUrl,
        description,
        category: selectedCategory,
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
          <option value="" disabled>Selecciona una categoría</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className={label}>Imagen principal *</p>
        <MediaPicker
          selected={image ? [image] : []}
          onChange={(urls) => setImage(urls[0] ?? "")}
        />
        {image && (
          <div className="mt-3 max-w-48">
            <ImagePreview
              key={image}
              src={image}
              label="Imagen principal"
            />
          </div>
        )}
      </div>

      <div>
        <p className={label}>Galería adicional</p>
        <p className="mb-2 text-xs text-ink/60">
          Puedes seleccionar varias fotografías.
        </p>
        <MediaPicker selected={gallery} multiple onChange={setGallery} />
        {gallery.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((url, index) => (
              <ImagePreview
                key={`${url}-${index}`}
                src={url}
                label={`Galería ${index + 1}`}
              />
            ))}
          </div>
        )}
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
