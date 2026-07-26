import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const command = isWindows ? "wsl.exe" : "bash";
const setupCommand = [
  isWindows
    ? 'mkdir -p "$HOME/.local/share/amishi-website"'
    : "true",
  isWindows
    ? 'python3 -m venv "$HOME/.local/share/amishi-website/venv"'
    : "python3 -m venv .venv",
  isWindows
    ? '"$HOME/.local/share/amishi-website/venv/bin/python" -m pip install -r requirements.txt -r requirements-dev.txt'
    : ".venv/bin/python -m pip install -r requirements.txt -r requirements-dev.txt",
].join(" && ");
const args = isWindows
  ? ["-d", "Ubuntu", "--", "bash", "-lc", setupCommand]
  : ["-lc", setupCommand];

console.log("Preparando el entorno Python aislado...");
const result = spawnSync(command, args, { stdio: "inherit" });

if (result.error) {
  console.error(`No se pudo ejecutar ${command}: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("La preparación del backend falló.");
  process.exit(result.status ?? 1);
}

console.log("Entorno listo. Ejecuta: npm run dev:all");
