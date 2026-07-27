"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <main id="contenido-principal" className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="contenido-principal" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
