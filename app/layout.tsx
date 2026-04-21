import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { AppProviders } from "@/components/AppProviders";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LOGO_PATH, SITE } from "@/lib/site";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amishi.cl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Catálogo · Amishi",
    template: "%s · Amishi",
  },
  description:
    "Pequeño universo de diseño, ilustración y cerámica hecha a mano en Chile. Inspirado en los gatos y lo cotidiano.",
  openGraph: {
    title: "Catálogo · Amishi",
    description:
      "Cerámica artesanal, ilustración y detalles con alma felina. Hecho en Chile.",
    locale: "es_CL",
    siteName: "Amishi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo · Amishi",
    description:
      "Cerámica artesanal, ilustración y detalles con alma felina. Hecho en Chile.",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: LOGO_PATH,
    apple: LOGO_PATH,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${nunito.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <a
          href="#contenido-principal"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white opacity-0 shadow-md transition focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose"
        >
          Ir al contenido principal
        </a>
        <AnnouncementBar />
        <AppProviders>
          <Header siteName={SITE.name} instagramUrl={SITE.instagramUrl} />
          <main id="contenido-principal" className="flex-1">
            {children}
          </main>
          <Footer siteName={SITE.name} instagramUrl={SITE.instagramUrl} />
        </AppProviders>
      </body>
    </html>
  );
}
