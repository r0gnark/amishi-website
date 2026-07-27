"use client";

import { useRouter } from "next/navigation";
import { ProductForm, ProductFormValues } from "@/components/admin/ProductForm";

export default function NuevoProductoPage() {
  const router = useRouter();

  async function handleCreate(values: ProductFormValues) {
    const res = await fetch("/api/admin/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.detail ?? "Error al crear el producto");
    }
    router.push("/admin/productos");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Nuevo producto</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <ProductForm onSubmit={handleCreate} submitLabel="Crear producto" />
      </div>
    </div>
  );
}
