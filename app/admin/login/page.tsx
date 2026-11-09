"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import PasswordInput from "@/components/admin/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [methods, setMethods] = useState<string[]>([]);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("Credenciales incorrectas");
        return;
      }
      if (payload.mfa_required) {
        setMfaToken(payload.mfa_token);
        setMethods(payload.methods ?? []);
        setMaskedEmail(payload.masked_email ?? "");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function sendEmailCode() {
    setError("");
    setEmailNotice("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfa_token: mfaToken }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof payload.detail === "string" ? payload.detail : "No fue posible enviar el correo");
        return;
      }
      setEmailNotice(`Enviamos un código a ${payload.masked_email || maskedEmail}`);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfa_token: mfaToken, code }),
      });
      if (!res.ok) {
        setError("Código incorrecto");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 space-y-6">
        <h1 className="font-display text-2xl text-ink text-center">Amishi · Admin</h1>

        {mfaToken ? (
          <form onSubmit={handleMfa} className="space-y-4">
            <p className="text-sm text-clay text-center">
              {methods.includes("totp")
                ? "Ingresa el código de Google Authenticator. Cambia cada 30 segundos y coincide con este sitio."
                : "Ingresa el código que te enviamos por correo, o un código de recuperación."}
            </p>
            {methods.includes("email") && (
              <button
                type="button"
                onClick={sendEmailCode}
                disabled={loading}
                className="w-full rounded-lg border border-blush py-2 text-sm font-medium text-ink hover:bg-cream transition-colors disabled:opacity-60"
              >
                Enviar código a {maskedEmail || "mi correo"}
              </button>
            )}
            {emailNotice && <p className="text-sm text-ink text-center">{emailNotice}</p>}
            <div>
              <label htmlFor="mfa-code" className="block text-sm font-medium text-ink mb-1">
                Código
              </label>
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            {error && (
              <p className="text-sm text-clay" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-clay py-2 text-sm font-medium text-white hover:bg-rose transition-colors disabled:opacity-60"
            >
              {loading ? "Comprobando…" : "Confirmar"}
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose"
            />
          </div>

          <PasswordInput
            id="password"
            label="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />

          {error && (
            <p className="text-sm text-clay" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-clay py-2 text-sm font-medium text-white hover:bg-rose transition-colors disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
