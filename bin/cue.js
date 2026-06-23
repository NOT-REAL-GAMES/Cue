#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { parse } from "../src/parser.js";
import { renderHtml } from "../src/render-html.js";

const [, , command, ...args] = process.argv;
const { input, output } = parseArgs(args);

if (!command || !input || !["parse", "html"].includes(command)) {
  printUsage();
  process.exit(command ? 1 : 0);
}

const inputPath = resolve(input);
const source = readFileSync(inputPath, "utf8");
const document = parse(source, { filename: inputPath });

if (command === "parse") {
  process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
}

if (command === "html") {
  const outputPath = output ? resolve(output) : resolve(`${basename(inputPath, ".cue")}.html`);

  writeFileSync(outputPath, renderHtml(document), "utf8");
  process.stdout.write(`Rendered ${outputPath}\n`);
}

function parseArgs(rawArgs) {
  const outputIndex = rawArgs.indexOf("-o");
  const inputTokens = outputIndex >= 0 ? rawArgs.slice(0, outputIndex) : rawArgs;
  const outputTokens = outputIndex >= 0 ? rawArgs.slice(outputIndex + 1) : [];

  return {
    input: inputTokens.join(" ").trim(),
    output: outputTokens.join(" ").trim()
  };
}

function printUsage() {
  process.stderr.write(`Cue

Usage:
  cue parse <file.cue>
  cue html <file.cue> [-o output.html]
`);
}
