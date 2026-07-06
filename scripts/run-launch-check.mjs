import { spawn } from "node:child_process";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import os from "node:os";
import process from "node:process";

const apiPort = process.env.LAUNCH_CHECK_API_PORT ?? "5312";
const frontendPort = process.env.LAUNCH_CHECK_FRONTEND_PORT ?? "5311";
const smtpPort = Number(process.env.LAUNCH_CHECK_SMTP_PORT ?? "2526");
const dbName = process.env.LAUNCH_CHECK_DB ?? `dwk_launch_check_${Date.now()}`;
const dbUser = process.env.LAUNCH_CHECK_DB_USER ?? os.userInfo().username;
const serviceTimeoutMs = Number(process.env.LAUNCH_CHECK_SERVICE_TIMEOUT_MS ?? "60000");
const connectionString =
  process.env.LAUNCH_CHECK_CONNECTION_STRING ??
  `Host=localhost;Port=5432;Database=${dbName};Username=${dbUser}`;

const children = new Set();
let smtpServer;
let smtpMessages = 0;

async function main() {
  process.on("SIGINT", () => {
    cleanup().finally(() => process.exit(130));
  });
  process.on("SIGTERM", () => {
    cleanup().finally(() => process.exit(143));
  });

  await run("dropdb", ["--if-exists", "--force", dbName], { allowFailure: true });
  await run("createdb", [dbName]);
  await run("dotnet", [
    "ef",
    "database",
    "update",
    "--project",
    "server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj",
    "--startup-project",
    "server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj",
  ], {
    env: {
      ConnectionStrings__Postgres: connectionString,
    },
  });

  smtpServer = await startSmtpServer(smtpPort);
  const api = start("dotnet", [
    "run",
    "--no-launch-profile",
    "--project",
    "server/DuurzaamWoningKompas.Api/DuurzaamWoningKompas.Api.csproj",
  ], {
    env: {
      ASPNETCORE_ENVIRONMENT: "Development",
      ASPNETCORE_URLS: `http://127.0.0.1:${apiPort}`,
      ConnectionStrings__Postgres: connectionString,
      Admin__Username: "admin",
      Admin__Password: "browser-qa-password",
      Cors__AllowedOrigins__0: `http://127.0.0.1:${frontendPort}`,
      Notifications__SmtpHost: "127.0.0.1",
      Notifications__SmtpPort: String(smtpPort),
      Notifications__FromEmail: "noreply@example.test",
      Notifications__ToEmail: "admin@example.test",
      Notifications__EnableSsl: "false",
      Logging__LogLevel__Microsoft: "Warning",
    },
  });
  children.add(api);
  await waitForUrl(`http://127.0.0.1:${apiPort}/openapi/v1.json`);

  const frontend = start("npm", [
    "run",
    "dev",
    "--",
    "--port",
    frontendPort,
    "--host",
    "127.0.0.1",
  ], {
    env: {
      VITE_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
    },
  });
  children.add(frontend);
  await waitForUrl(`http://127.0.0.1:${frontendPort}/thuisbatterij-check?utm_source=google&utm_medium=cpc&gclid=launch-check`);

  await run("npm", ["run", "test:e2e"], {
    env: {
      PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${frontendPort}`,
      PLAYWRIGHT_API_URL: `http://127.0.0.1:${apiPort}`,
    },
  });

  if (smtpMessages < 1) {
    throw new Error("Launch-check verwacht minimaal 1 SMTP-bericht, maar er is niets ontvangen.");
  }

  console.log(`Launch-check OK: e2e groen, SMTP berichten ontvangen=${smtpMessages}, database=${dbName}`);
}

async function cleanup() {
  const runningChildren = [...children];
  for (const child of runningChildren) {
    stopChild(child);
  }
  await Promise.all(runningChildren.map((child) => waitForExit(child)));
  if (smtpServer) {
    const server = smtpServer;
    smtpServer = undefined;
    await new Promise((resolve) => server.close(() => resolve()));
  }
  await run("dropdb", ["--if-exists", "--force", dbName], { allowFailure: true });
}

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...(options.env ?? {}) },
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  child.on("exit", (code, signal) => {
    children.delete(child);
    if (code && code !== 0 && signal !== "SIGINT") {
      console.error(`${command} exited with code ${code}`);
    }
  });

  return child;
}

function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    child.kill("SIGINT");
    return;
  }

  try {
    process.kill(-child.pid, "SIGINT");
  } catch {
    child.kill("SIGINT");
  }
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      stopChild(child);
      resolve();
    }, 5_000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = start(command, args, options);
    child.on("exit", (code) => {
      if (code === 0 || options.allowFailure) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

function waitForUrl(url) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const statusCode = await requestStatus(url);
        if (statusCode >= 200 && statusCode < 300) {
          resolve();
          return;
        }
      } catch {
        // Keep polling until timeout.
      }

      if (Date.now() - startedAt > serviceTimeoutMs) {
        reject(new Error(`Timeout bij wachten op ${url}`));
        return;
      }

      setTimeout(poll, 500);
    };

    poll();
  });
}

function requestStatus(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;
    const request = client.request(parsedUrl, { method: "GET", timeout: 5_000 }, (response) => {
      response.resume();
      response.on("end", () => resolve(response.statusCode ?? 0));
    });

    request.on("timeout", () => {
      request.destroy(new Error(`Timeout bij request naar ${url}`));
    });
    request.on("error", reject);
    request.end();
  });
}

function startSmtpServer(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      let dataMode = false;
      let data = "";
      socket.setEncoding("utf8");
      socket.on("error", () => undefined);
      socket.write("220 dwk local smtp\r\n");
      socket.on("data", (chunk) => {
        for (const line of chunk.split(/\r?\n/)) {
          if (!line && !dataMode) continue;
          if (dataMode) {
            if (line === ".") {
              smtpMessages += 1;
              console.log(`SMTP_MESSAGE_RECEIVED count=${smtpMessages} bytes=${data.length}`);
              dataMode = false;
              data = "";
              socket.write("250 queued\r\n");
            } else {
              data += `${line}\n`;
            }
            continue;
          }

          const command = line.toUpperCase();
          if (command.startsWith("EHLO") || command.startsWith("HELO")) socket.write("250-localhost\r\n250 OK\r\n");
          else if (command.startsWith("MAIL FROM")) socket.write("250 sender ok\r\n");
          else if (command.startsWith("RCPT TO")) socket.write("250 recipient ok\r\n");
          else if (command === "DATA") {
            dataMode = true;
            socket.write("354 end with dot\r\n");
          } else if (command === "QUIT") {
            socket.write("221 bye\r\n");
            socket.end();
          } else if (command) {
            socket.write("250 ok\r\n");
          }
        }
      });
    });

    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      console.log(`SMTP_READY port=${port}`);
      resolve(server);
    });
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    await cleanup();
    process.exit(1);
  })
  .finally(async () => {
    await cleanup();
  });
