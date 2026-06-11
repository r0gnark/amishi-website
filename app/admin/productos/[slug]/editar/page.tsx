"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductForm, ProductFormValues } from "@/components/admin/ProductForm";

type Product = ProductFormValues & { id: string };

export default function EditarProductoPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/productos/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => data && setProduct(data));
  }, [slug]);

  async function handleUpdate(values: ProductFormValues) {
    const res = await fetch(`/api/admin/productos/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.detail ?? "Error al guardar");
    }
    router.push("/admin/productos");
  }

  if (notFound) return <p className="text-clay">Producto no encontrado.</p>;
  if (!product) return <p className="text-sm text-clay">Cargando…</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Editar producto</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <ProductForm
          initial={{
            name: product.name,
            price: product.price,
            image: product.image,
            gallery: product.gallery ?? [],
            instagramUrl: product.instagramUrl,
            description: product.description,
            category: product.category,
          }}
          onSubmit={handleUpdate}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
