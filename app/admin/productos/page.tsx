"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
};

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/productos")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/productos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Error al eliminar el producto");
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-rose transition-colors"
        >
          + Nuevo producto
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-clay">Cargando…</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b border-blush">
              <tr>
                <th className="text-left px-4 py-3 text-ink font-medium">Imagen</th>
                <th className="text-left px-4 py-3 text-ink font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-ink font-medium">Precio</th>
                <th className="text-left px-4 py-3 text-ink font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-ink font-medium">Slug</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-blush">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="h-14 w-14 overflow-hidden rounded-lg border border-blush bg-cream">
                      {/* Las imágenes pueden usar rutas locales o dominios externos. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-ink">
                    {p.price.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}
                  </td>
                  <td className="px-4 py-3 text-clay">{p.category}</td>
                  <td className="px-4 py-3 text-ink/50 font-mono text-xs">{p.id}</td>
                  <td className="px-4 py-3 flex gap-3 justify-end">
                    <Link
                      href={`/admin/productos/${p.id}/editar`}
                      className="text-clay hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deleting === p.id}
                      className="text-rose hover:underline disabled:opacity-50"
                    >
                      {deleting === p.id ? "…" : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="text-sm text-clay px-4 py-6 text-center">No hay productos todavía.</p>
          )}
        </div>
      )}
    </div>
  );
}
