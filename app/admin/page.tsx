"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/productos")
      .then((r) => r.json())
      .then((data: unknown[]) => setCount(data.length))
      .catch(() => setCount(0));
  }, []);

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="font-display text-2xl text-ink">Dashboard</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-clay font-medium uppercase tracking-wide">Productos</p>
          <p className="text-4xl font-display text-ink mt-1">
            {count === null ? "—" : count}
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-rose transition-colors"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-medium text-ink mb-3">Accesos rápidos</h2>
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/productos" className="text-sm text-clay underline underline-offset-2">
            Ver todos los productos
          </Link>
          <Link href="/admin/contenido" className="text-sm text-clay underline underline-offset-2">
            Editar contenido del sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
