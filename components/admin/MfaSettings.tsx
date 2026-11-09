"use client";

import { useEffect, useState } from "react";

import PasswordInput from "@/components/admin/PasswordInput";

type Setup = {
  secret: string;
  qr_svg: string;
};

function errorMessage(payload: { detail?: unknown }, fallback: string): string {
  return typeof payload.detail === "string" ? payload.detail : fallback;
}

function groupedSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

export default function MfaSettings() {
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailPending, setEmailPending] = useState(false);
  const [password, setPassword] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/cuenta/mfa")
      .then((response) => (response.ok ? response.json() : {}))
      .then((payload: { totp_enabled?: boolean; email_enabled?: boolean; masked_email?: string }) => {
        if (!active) return;
        setTotpEnabled(Boolean(payload.totp_enabled));
        setEmailEnabled(Boolean(payload.email_enabled));
        setMaskedEmail(payload.masked_email ?? "");
      })
      .catch(() => {
        if (active) setError("No fue posible consultar la autenticación en dos pasos");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function startSetup() {
    setError("");
    setRecoveryCodes([]);
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cuenta/mfa/setup", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(errorMessage(payload, "No fue posible generar el código QR"));
        return;
      }
      setSetup({ secret: payload.secret, qr_svg: payload.qr_svg });
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cuenta/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(errorMessage(payload, "El código no es válido"));
        return;
      }
      setRecoveryCodes(payload.recovery_codes ?? []);
      setSetup(null);
      setCode("");
      setTotpEnabled(true);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function disable(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cuenta/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(errorMessage(payload, "No fue posible desactivar la app autenticadora"));
        return;
      }
      setTotpEnabled(false);
      setPassword("");
      setCode("");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function startEmail() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cuenta/mfa/email/start", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(errorMessage(payload, "No fue posible enviar el correo"));
        return;
      }
      setMaskedEmail(payload.masked_email ?? maskedEmail);
      setEmailPending(true);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function confirmEmail(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cuenta/mfa/email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailCode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(errorMessage(payload, "El código no es válido"));
        return;
      }
      if (payload.recovery_codes?.length) setRecoveryCodes(payload.recovery_codes);
      setEmailPending(false);
      setEmailCode("");
      setEmailEnabled(true);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function disableEmail(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/cuenta/mfa/email/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: emailPassword }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(errorMessage(payload, "No fue posible desactivar el correo"));
        return;
      }
      setEmailEnabled(false);
      setEmailPassword("");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  const qrSrc = setup
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr_svg)}`
    : "";

  return (
    <section className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-display text-xl text-ink">Autenticación en dos pasos</h2>
        <p className="mt-1 text-sm text-clay">
          Puedes usar Google Authenticator u otra app, el correo de ingreso, o los dos.
        </p>
      </div>

      {!ready && <p className="text-sm text-clay">Cargando…</p>}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-ink">App autenticadora</h3>
        <p className="text-sm text-clay">
          Escanea el QR o agrega la clave en Google Authenticator. La app y este sitio
          calculan el mismo código cada 30 segundos: no necesitan estar conectados.
        </p>

        {ready && !totpEnabled && !setup && (
          <button
            type="button"
            onClick={startSetup}
            disabled={loading}
            className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose disabled:opacity-60"
          >
            {loading ? "Generando…" : "Mostrar código QR"}
          </button>
        )}

        {setup && (
          <form onSubmit={confirmSetup} className="space-y-4">
            <img
              src={qrSrc}
              alt="Código QR para agregar Amishi en Google Authenticator"
              className="h-48 w-48 rounded-lg border border-blush bg-white p-2"
            />
            <p className="text-xs text-clay">
              En la app: escanear QR, o «Ingresar clave» y escribir:
            </p>
            <p className="break-all font-mono text-sm text-ink">{groupedSecret(setup.secret)}</p>
            <div>
              <label htmlFor="mfa-setup-code" className="mb-1 block text-sm font-medium text-ink">
                Código de 6 dígitos que muestra la app
              </label>
              <input
                id="mfa-setup-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose disabled:opacity-60"
            >
              {loading ? "Comprobando…" : "Activar app"}
            </button>
          </form>
        )}

        {ready && totpEnabled && (
          <form onSubmit={disable} className="space-y-4">
            <p className="text-sm text-ink">La app autenticadora está activa.</p>
            <PasswordInput
              id="mfa-disable-password"
              label="Contraseña actual"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
            />
            <div>
              <label htmlFor="mfa-disable-code" className="mb-1 block text-sm font-medium text-ink">
                Código de la app o de recuperación
              </label>
              <input
                id="mfa-disable-code"
                autoComplete="one-time-code"
                required
                minLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-blush px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-60"
            >
              {loading ? "Desactivando…" : "Desactivar app"}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4 border-t border-blush pt-4">
        <h3 className="text-sm font-medium text-ink">Código por correo</h3>
        <p className="text-sm text-clay">
          Si lo prefieres, en cada ingreso te enviamos un código a {maskedEmail || "tu correo de ingreso"}.
        </p>

        {ready && !emailEnabled && !emailPending && (
          <button
            type="button"
            onClick={startEmail}
            disabled={loading}
            className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar código de prueba"}
          </button>
        )}

        {emailPending && !emailEnabled && (
          <form onSubmit={confirmEmail} className="space-y-4">
            <p className="text-sm text-clay">Revisa {maskedEmail} e ingresa el código.</p>
            <div>
              <label htmlFor="mfa-email-code" className="mb-1 block text-sm font-medium text-ink">
                Código del correo
              </label>
              <input
                id="mfa-email-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                value={emailCode}
                onChange={(event) => setEmailCode(event.target.value)}
                className="w-full rounded-lg border border-blush px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rose"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-clay px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose disabled:opacity-60"
            >
              {loading ? "Comprobando…" : "Activar correo"}
            </button>
          </form>
        )}

        {ready && emailEnabled && (
          <form onSubmit={disableEmail} className="space-y-4">
            <p className="text-sm text-ink">El código por correo está activo.</p>
            <PasswordInput
              id="mfa-email-disable-password"
              label="Contraseña actual"
              autoComplete="current-password"
              value={emailPassword}
              onChange={setEmailPassword}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border border-blush px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream disabled:opacity-60"
            >
              {loading ? "Desactivando…" : "Desactivar correo"}
            </button>
          </form>
        )}
      </div>

      {recoveryCodes.length > 0 && (
        <div className="space-y-2 rounded-lg bg-cream p-4">
          <p className="text-sm text-ink">
            Guarda estos códigos de recuperación. No se volverán a mostrar. Cada uno sirve
            una sola vez si pierdes el teléfono o no llega el correo.
          </p>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-ink">
            {recoveryCodes.map((recovery) => (
              <li key={recovery}>{recovery}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="text-sm text-clay" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
