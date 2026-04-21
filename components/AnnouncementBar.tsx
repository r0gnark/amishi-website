"use client";

import { useEffect, useState } from "react";

const messages = [
  "Envíos a todo Chile — consulta tiempos por DM",
  "Síguenos en Instagram para novedades y drops",
  "Piezas hechas a mano — ediciones limitadas",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="border-b border-rose/30 bg-blush/80 px-4 py-2 text-center text-sm text-ink backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center justify-center gap-2">
        <span aria-hidden>✿</span>
        <span key={index}>{messages[index]}</span>
        <span aria-hidden>✿</span>
      </span>
    </div>
  );
}
