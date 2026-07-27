"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/imagenes", label: "Imágenes" },
  { href: "/admin/contenido", label: "Contenido" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (isLoginPage) {
    return children;
  }

  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-52 shrink-0 bg-white border-r border-blush flex flex-col">
        <div className="px-5 py-4 border-b border-blush">
          <span className="font-display text-lg text-ink">Amishi</span>
          <span className="ml-1 text-xs text-clay">admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === href
                  ? "bg-blush text-clay font-medium"
                  : "text-ink hover:bg-cream"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-blush">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-sm text-ink hover:bg-cream transition-colors text-left"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
