"use client";

import { useEffect, useState } from "react";

type MediaItem = {
  name: string;
  url: string;
};

type Props = {
  selected?: string[];
  multiple?: boolean;
  onChange?: (urls: string[]) => void;
  browseOnly?: boolean;
};

export function MediaPicker({
  selected = [],
  multiple = false,
  onChange = () => undefined,
  browseOnly = false,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    function addUploadedItem(event: Event) {
      const item = (event as CustomEvent<MediaItem>).detail;
      setItems((current) =>
        current.some((existing) => existing.url === item.url)
          ? current
          : [item, ...current],
      );
    }

    fetch("/api/admin/media")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo cargar la biblioteca");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo cargar la biblioteca de imágenes");
          setLoading(false);
        }
      });
    window.addEventListener("amishi-media-added", addUploadedItem);

    return () => {
      cancelled = true;
      window.removeEventListener("amishi-media-added", addUploadedItem);
    };
  }, []);

  function toggle(url: string) {
    if (browseOnly) return;
    if (!multiple) {
      onChange([url]);
      return;
    }
    onChange(
      selected.includes(url)
        ? selected.filter((selectedUrl) => selectedUrl !== url)
        : [...selected, url],
    );
  }

  async function upload(file: File) {
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail ?? "No se pudo subir la imagen");
      }

      const item = { name: data.name, url: data.url };
      window.dispatchEvent(
        new CustomEvent<MediaItem>("amishi-media-added", { detail: item }),
      );
      if (!browseOnly) {
        onChange(multiple ? [...selected, item.url] : [item.url]);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose">
          {uploading ? "Subiendo…" : "Subir nueva imagen"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
        </label>
        <span className="text-xs text-ink/60">JPG, PNG o WebP · máximo 10 MB</span>
      </div>

      {error && <p className="text-sm text-rose">{error}</p>}

      {loading ? (
        <p className="text-sm text-clay">Cargando imágenes…</p>
      ) : (
        <div
          className={`rounded-xl border border-blush bg-cream/30 p-3 ${
            browseOnly ? "" : "max-h-96 overflow-y-auto"
          }`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => {
              const isSelected = selected.includes(item.url);
              return (
                <button
                  type="button"
                  key={item.url}
                  onClick={() => toggle(item.url)}
                  tabIndex={browseOnly ? -1 : 0}
                  className={`relative overflow-hidden rounded-xl border-2 bg-white text-left transition ${
                    isSelected
                      ? "border-clay ring-2 ring-clay/20"
                      : `border-transparent ${browseOnly ? "" : "hover:border-blush"}`
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="block aspect-square">
                    {/* La biblioteca admite imágenes locales administradas dinámicamente. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs text-ink/60">
                    {item.name}
                  </span>
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-clay text-sm text-white">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-clay">
              Todavía no hay imágenes. Sube la primera.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
