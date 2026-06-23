import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { parse } from "../src/parser.js";
import { renderHtml } from "../src/render-html.js";

const root = resolve(import.meta.dirname, "..");
const spacedScript = resolve(root, "examples", "VINAMAR - Episode One - Good Man.cue");
const spacedHtml = resolve(root, "examples", "VINAMAR - Episode One - Good Man.test.html");

describe("Cue CLI", () => {
  it("parses file paths split by spaces", () => {
    const result = spawnSync(
      process.execPath,
      ["./bin/cue.js", "parse", ...spacedScript.split(" ")],
      {
        cwd: root,
        encoding: "utf8"
      }
    );

    assert.equal(result.status, 0, result.stderr);
    const document = JSON.parse(result.stdout);
    assert.equal(document.filename, spacedScript);
  });

  it("renders input and output paths split by spaces", () => {
    rmSync(spacedHtml, { force: true });

    const result = spawnSync(
      process.execPath,
      ["./bin/cue.js", "html", ...spacedScript.split(" "), "-o", ...spacedHtml.split(" ")],
      {
        cwd: root,
        encoding: "utf8"
      }
    );

    rmSync(spacedHtml, { force: true });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Rendered/);
  });

  it("includes print page break CSS after the title page", () => {
    const html = renderHtml(
      parse(`---
title: Title Page
---

.INT. ROOM - DAY

Something happens.
`)
    );

    assert.match(html, /class="script-body"/);
    assert.match(html, /margin:\s*0\.75in 0\.9in/);
    assert.match(html, /break-before:\s*page/);
    assert.match(html, /page-break-before:\s*always/);
    assert.doesNotMatch(html, /script-start/);
    assert.doesNotMatch(html, /break-after:\s*page/);
    assert.doesNotMatch(html, /page-break-after:\s*always/);
    assert.equal(html.match(/break-before:\s*page/g)?.length, 1);
    assert.equal(html.match(/page-break-before:\s*always/g)?.length, 1);
  });
});
