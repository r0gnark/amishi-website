"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import PasswordInput from "@/components/admin/PasswordInput";

export default function SeguridadPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmation) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/cuenta/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.detail || "No fue posible cambiar la contraseña");
        return;
      }
      router.push("/admin/login");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Seguridad</h1>
        <p className="mt-1 text-sm text-clay">
          Al guardar, se cerrarán todas las sesiones y deberás ingresar nuevamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <PasswordInput
          id="current-password"
          label="Contraseña actual"
          autoComplete="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
        />
        <PasswordInput
          id="new-password"
          label="Nueva contraseña"
          autoComplete="new-password"
          minLength={12}
          value={newPassword}
          onChange={setNewPassword}
        />
        <PasswordInput
          id="confirm-password"
          label="Confirmar nueva contraseña"
          autoComplete="new-password"
          minLength={12}
          value={confirmation}
          onChange={setConfirmation}
        />

        <p className="text-xs text-clay">Usa al menos 12 caracteres.</p>

        {error && (
          <p className="text-sm text-clay" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
