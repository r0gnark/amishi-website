import { spawn, spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const backend = isWindows
  ? spawn(
      "wsl.exe",
      [
        "-d",
        "Ubuntu",
        "--",
        "bash",
        "-lc",
        'test -x "$HOME/.local/share/amishi-website/venv/bin/python" || { echo "Falta el entorno Python. Ejecuta: npm run setup"; exit 1; }; exec "$HOME/.local/share/amishi-website/venv/bin/python" -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000',
      ],
      { stdio: "inherit" },
    )
  : spawn(
      ".venv/bin/python",
      [
        "-m",
        "uvicorn",
        "backend.main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
      ],
      { stdio: "inherit" },
    );

const frontend = spawn(
  isWindows ? (process.env.ComSpec ?? "cmd.exe") : "npm",
  isWindows ? ["/d", "/s", "/c", "npm.cmd run dev"] : ["run", "dev"],
  { stdio: "inherit" },
);

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  if (isWindows) {
    for (const child of [backend, frontend]) {
      if (child.pid) {
        spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      }
    }
  } else {
    backend.kill("SIGTERM");
    frontend.kill("SIGTERM");
  }
  process.exitCode = exitCode;
}

backend.on("error", (error) => {
  console.error(`No se pudo iniciar FastAPI: ${error.message}`);
  stop(1);
});
frontend.on("error", (error) => {
  console.error(`No se pudo iniciar Next.js: ${error.message}`);
  stop(1);
});
backend.on("exit", (code) => stop(code ?? 0));
frontend.on("exit", (code) => stop(code ?? 0));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

console.log("Amishi iniciando:");
console.log("- Sitio: http://localhost:3000");
console.log("- API:   http://localhost:8000/docs");
