"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SiteContent = {
  siteName: string;
  announcementBar: string;
  aboutTitle: string;
  about: string;
  aboutImage: string;
  contactLabel: string;
  contactUrl: string;
  instagramHandle: string;
  instagramProfileUrl: string;
  footerText: string;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  siteName: "amishi",
  announcementBar: "Envíos a todo Chile — consulta tiempos por DM",
  aboutTitle: "Bienvenid@ a Amishi",
  about:
    "Un rincón creado para quienes aman los gatos y los pequeños detalles. Aquí todo nace desde el cariño por el diseño y por los mishi.\n\nCada pieza está hecha a mano, con tiempo y dedicación, por eso ninguna es igual a otra.",
  aboutImage: "/images/sobre-amishi.png",
  contactLabel: "Contacto",
  contactUrl: "https://wa.me/56989913721",
  instagramHandle: "@amishi.cl",
  instagramProfileUrl: "https://www.instagram.com/amishi.cl/",
  footerText: "Diseño, gatos y cerámica hecha con cariño en Chile.",
};

const SiteContentContext = createContext(DEFAULT_SITE_CONTENT);

export function SiteContentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/contenido")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setContent({ ...DEFAULT_SITE_CONTENT, ...data });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
