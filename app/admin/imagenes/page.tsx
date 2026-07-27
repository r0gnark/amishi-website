"use client";

import { MediaPicker } from "@/components/admin/MediaPicker";

export default function AdminImagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-clay">
          Multimedia
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">Biblioteca de imágenes</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          Consulta todas las fotografías disponibles y sube nuevos archivos para
          utilizarlos en productos, categorías y contenidos del sitio.
        </p>
      </div>

      <MediaPicker browseOnly />
    </div>
  );
}
