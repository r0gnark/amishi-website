"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCategories } from "@/components/CategoryContext";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  available?: boolean;
  stock?: number | null;
};

const fieldClass =
  "rounded-lg border border-blush bg-white px-3 py-2 text-sm text-ink";

export default function AdminProductosPage() {
  const categories = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [onlyUnavailable, setOnlyUnavailable] = useState(false);
  const [availability, setAvailability] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [applying, setApplying] = useState(false);
  const [bulkError, setBulkError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/productos")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el catálogo");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProducts = useMemo(
    () =>
      onlyUnavailable
        ? products.filter((product) => product.available === false)
        : products,
    [onlyUnavailable, products],
  );
  const unavailableCount = products.filter((product) => product.available === false).length;
  const visibleIds = visibleProducts.map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleVisible() {
    setSelected((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...current, ...visibleIds])];
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/productos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelected((current) => current.filter((item) => item !== id));
      } else {
        alert("Error al eliminar el producto");
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleBulkApply() {
    const ids = selected.filter((id) => products.some((product) => product.id === id));
    const changes: Record<string, unknown> = {};
    if (availability === "true") changes.available = true;
    if (availability === "false") changes.available = false;
    if (category) changes.category = category;
    if (price !== "") changes.price = Number(price);
    if (stock !== "") changes.stock = Number(stock);

    if (ids.length === 0) {
      setBulkError("Selecciona al menos un producto.");
      return;
    }
    if (Object.keys(changes).length === 0) {
      setBulkError("Elige al menos un dato para cambiar.");
      return;
    }
    if (
      (price !== "" && !Number.isInteger(changes.price)) ||
      (stock !== "" && !Number.isInteger(changes.stock)) ||
      (typeof changes.price === "number" && changes.price < 0) ||
      (typeof changes.stock === "number" && changes.stock < 0)
    ) {
      setBulkError("Precio y stock tienen que ser números enteros de 0 o más.");
      return;
    }

    const label = ids.length === 1 ? "1 producto" : `${ids.length} productos`;
    if (!confirm(`¿Aplicar estos cambios a ${label}?`)) return;

    setApplying(true);
    setBulkError("");
    try {
      const res = await fetch("/api/admin/productos/masivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, ...changes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setBulkError(body?.detail ?? "No se pudieron actualizar los productos.");
        return;
      }
      const updated: Product[] = await res.json();
      const byId = new Map(updated.map((product) => [product.id, product]));
      setProducts((current) =>
        current.map((product) => byId.get(product.id) ?? product),
      );
      setSelected([]);
      setAvailability("");
      setCategory("");
      setPrice("");
      setStock("");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Productos</h1>
          <p className="mt-1 text-sm text-clay">
            {unavailableCount === 0
              ? "Ningún producto está marcado como no disponible."
              : `${unavailableCount} ${
                  unavailableCount === 1
                    ? "producto está marcado como no disponible"
                    : "productos están marcados como no disponibles"
                }.`}
          </p>
        </div>
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
        <>
          <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-ink">
                Disponibilidad
                <select
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                  className={`${fieldClass} mt-1 block`}
                >
                  <option value="">Sin cambio</option>
                  <option value="true">Disponible</option>
                  <option value="false">No disponible</option>
                </select>
              </label>
              <label className="text-sm text-ink">
                Categoría
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={`${fieldClass} mt-1 block`}
                >
                  <option value="">Sin cambio</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-ink">
                Precio
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={price}
                  placeholder="Sin cambio"
                  onChange={(event) => setPrice(event.target.value)}
                  className={`${fieldClass} mt-1 block w-32`}
                />
              </label>
              <label className="text-sm text-ink">
                Stock
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={stock}
                  placeholder="Sin cambio"
                  onChange={(event) => setStock(event.target.value)}
                  className={`${fieldClass} mt-1 block w-32`}
                />
              </label>
              <button
                type="button"
                onClick={handleBulkApply}
                disabled={applying || selected.length === 0}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {applying
                  ? "Aplicando…"
                  : `Aplicar a ${selected.length} seleccionado${selected.length === 1 ? "" : "s"}`}
              </button>
            </div>
            <p className="text-xs text-clay">
              Marca los productos de la tabla. Los campos en «Sin cambio» no se tocan.
            </p>
            {bulkError && <p className="text-sm text-rose">{bulkError}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOnlyUnavailable((current) => !current)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                onlyUnavailable ? "bg-ink text-white" : "bg-white text-clay"
              }`}
            >
              {onlyUnavailable ? "Ver todos" : "Ver solo no disponibles"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-cream border-b border-blush">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisible}
                      aria-label="Seleccionar productos visibles"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-ink font-medium">Imagen</th>
                  <th className="text-left px-4 py-3 text-ink font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-ink font-medium">Precio</th>
                  <th className="text-left px-4 py-3 text-ink font-medium">Categoría</th>
                  <th className="text-left px-4 py-3 text-ink font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-ink font-medium">Stock</th>
                  <th className="text-left px-4 py-3 text-ink font-medium">Slug</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-blush">
                {visibleProducts.map((p) => {
                  const unavailable = p.available === false;
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        unavailable ? "bg-rose/10" : "hover:bg-cream/50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggle(p.id)}
                          aria-label={`Seleccionar ${p.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-14 w-14 overflow-hidden rounded-lg border border-blush bg-cream">
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
                        {p.price.toLocaleString("es-CL", {
                          style: "currency",
                          currency: "CLP",
                        })}
                      </td>
                      <td className="px-4 py-3 text-clay">{p.category}</td>
                      <td className="px-4 py-3">
                        {unavailable ? (
                          <span className="rounded-full bg-rose px-2.5 py-1 text-xs font-medium text-white">
                            No disponible
                          </span>
                        ) : (
                          <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-clay">
                            Disponible
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {p.stock === null || p.stock === undefined ? "—" : p.stock}
                      </td>
                      <td className="px-4 py-3 text-ink/50 font-mono text-xs">{p.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 justify-end">
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleProducts.length === 0 && (
              <p className="text-sm text-clay px-4 py-6 text-center">
                {products.length === 0
                  ? "No hay productos todavía."
                  : "No hay productos no disponibles."}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
