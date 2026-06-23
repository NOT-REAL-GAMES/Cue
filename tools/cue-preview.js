#!/usr/bin/env node
import { existsSync, readFileSync, watch, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { parse } from "../src/parser.js";
import { renderHtml } from "../src/render-html.js";

const { input, shouldOpen, portArg } = parseArgs(process.argv.slice(2));
const basePort = portArg ? Number(portArg) : 3718;

if (!input) {
  printUsage();
  process.exit(1);
}

const inputPath = resolve(input);

if (!existsSync(inputPath)) {
  console.error(`Cue preview: file not found: ${inputPath}`);
  process.exit(1);
}

if (extname(inputPath).toLowerCase() !== ".cue") {
  console.error(`Cue preview: expected a .cue file, got: ${inputPath}`);
  process.exit(1);
}

const outputPath = inputPath.slice(0, -extname(inputPath).length) + ".html";
const clients = new Set();
let cleanHtml = "";
let previewHtml = "";
let renderTimer = null;

render();

const server = await listen(basePort);
const url = `http://127.0.0.1:${server.address().port}/`;

console.log(`Cue live preview`);
console.log(`Watching: ${inputPath}`);
console.log(`Writing:  ${outputPath}`);
console.log(`Serving:  ${url}`);

if (shouldOpen) {
  openUrl(url);
}

watch(dirname(inputPath), { persistent: true }, (_eventType, changedFile) => {
  if (!changedFile || changedFile.toString() === basename(inputPath)) {
    scheduleRender();
  }
});

process.stdin.resume();

function parseArgs(rawArgs) {
  const positionals = [];
  let shouldOpen = false;
  let portArg = null;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--open") {
      shouldOpen = true;
      continue;
    }

    if (arg === "--port") {
      portArg = rawArgs[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      continue;
    }

    positionals.push(arg);
  }

  return {
    input: positionals.join(" ").trim(),
    shouldOpen,
    portArg
  };
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    const changed = render();

    if (changed) {
      broadcast("reload");
    }
  }, 120);
}

function render() {
  try {
    const source = readFileSync(inputPath, "utf8");
    const document = parse(source, { filename: inputPath });
    const nextHtml = renderHtml(document);

    if (nextHtml === cleanHtml && existsSync(outputPath)) {
      return false;
    }

    cleanHtml = nextHtml;
    previewHtml = injectLiveReload(nextHtml);
    writeFileSync(outputPath, cleanHtml, "utf8");
    console.log(`[${new Date().toLocaleTimeString()}] rendered ${basename(outputPath)}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    previewHtml = renderError(message);
    console.error(message);
    return true;
  }
}

function listen(port) {
  return new Promise((resolveServer, reject) => {
    const previewServer = createServer((request, response) => {
      if (request.url === "/events") {
        response.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive"
        });
        response.write("\n");
        clients.add(response);
        request.on("close", () => clients.delete(response));
        return;
      }

      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(previewHtml);
    });

    previewServer.on("error", (error) => {
      if (error.code === "EADDRINUSE" && port < basePort + 50) {
        resolveServer(listen(port + 1));
        return;
      }

      reject(error);
    });

    previewServer.listen(port, "127.0.0.1", () => resolveServer(previewServer));
  });
}

function broadcast(event) {
  for (const client of clients) {
    client.write(`event: ${event}\ndata: ${Date.now()}\n\n`);
  }
}

function injectLiveReload(html) {
  const script = `<script>
(() => {
  const events = new EventSource("/events");
  events.addEventListener("reload", () => location.reload());
})();
</script>`;

  return html.includes("</body>") ? html.replace("</body>", `${script}\n</body>`) : `${html}\n${script}`;
}

function renderError(message) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cue Preview Error</title>
  <style>
    body {
      margin: 0;
      padding: 32px;
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      background: #fff7f5;
      color: #2a1612;
    }

    pre {
      white-space: pre-wrap;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <h1>Cue Preview Error</h1>
  <pre>${escapeHtml(message)}</pre>
</body>
</html>`;
}

function openUrl(targetUrl) {
  const platform = process.platform;

  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", targetUrl], { detached: true, stdio: "ignore" }).unref();
    return;
  }

  if (platform === "darwin") {
    spawn("open", [targetUrl], { detached: true, stdio: "ignore" }).unref();
    return;
  }

  spawn("xdg-open", [targetUrl], { detached: true, stdio: "ignore" }).unref();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printUsage() {
  console.error(`Usage:
  node tools/cue-preview.js <file.cue> [--open] [--port 3718]`);
}
