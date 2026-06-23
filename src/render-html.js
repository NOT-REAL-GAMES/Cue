export function renderHtml(document) {
  const title = document.metadata.title || "Untitled Cue Script";
  const blocks = document.blocks
    .filter((block) => block.type !== "comment")
    .map(renderBlock)
    .join("\n");
  const hasTitlePage = Boolean(document.metadata.title || document.metadata.author);
  const scriptBody = hasTitlePage ? `<section class="script-body">\n${blocks}\n    </section>` : blocks;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Courier New", Courier, monospace;
      background: #f4f1ea;
      color: #171717;
    }

    body {
      margin: 0;
      padding: 40px 16px;
    }

    main {
      box-sizing: border-box;
      width: min(100%, 8.5in);
      min-height: 11in;
      margin: 0 auto;
      padding: 0.75in 0.9in;
      background: #fffdf8;
      box-shadow: 0 14px 40px rgb(0 0 0 / 16%);
    }

    .title-page {
      min-height: 4.5in;
      display: grid;
      place-items: center;
      text-align: center;
    }

    .script-body {
      display: block;
    }

    .title-page h1 {
      margin: 0 0 16px;
      font-size: 18px;
      text-transform: uppercase;
    }

    .title-page p {
      margin: 4px 0;
      font-size: 12px;
    }

    .section {
      margin: 28px 0 18px;
      font-size: 13px;
      text-transform: uppercase;
    }

    .scene {
      margin: 18px 0 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .action {
      margin: 12px 0;
      white-space: pre-wrap;
      line-height: 1.45;
    }

    .dialogue {
      width: 62%;
      margin: 12px auto;
    }

    .cue {
      margin: 0 0 4px;
      text-align: center;
      text-transform: uppercase;
    }

    .speech,
    .parenthetical {
      margin: 0 0 4px;
      line-height: 1.45;
    }

    .parenthetical {
      width: 75%;
      margin-inline: auto;
    }

    .dual-dialogue {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 28px;
      margin: 12px 0;
    }

    .dual-dialogue .dialogue {
      width: 100%;
      margin: 0;
    }

    .shot {
      margin: 14px 0;
      font-weight: 700;
    }

    .transition {
      margin: 14px 0;
      text-align: right;
      text-transform: uppercase;
    }

    .note {
      margin: 14px 0;
      padding-left: 10px;
      border-left: 3px solid #d0a33f;
      color: #6b4c00;
      font-style: italic;
    }

    @media (max-width: 700px) {
      body {
        padding: 0;
      }

      main {
        min-height: auto;
        padding: 28px 18px;
        box-shadow: none;
      }

      .dialogue {
        width: 82%;
      }

      .dual-dialogue {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      @page {
        size: letter;
        margin: 0.75in 0.9in;
      }

      body {
        padding: 0;
        background: #fff;
      }

      main {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
        background: #fff;
      }

      .title-page {
        display: block;
        min-height: calc(11in - 1.5in);
      }

      .title-page > div {
        box-sizing: border-box;
        min-height: calc(11in - 1.5in);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .script-body {
        display: block;
        break-before: page;
        page-break-before: always;
      }

      .script-body > :first-child {
        margin-top: 0;
      }
    }
  </style>
</head>
<body>
  <main>
    ${renderTitlePage(document.metadata)}
    ${scriptBody}
  </main>
</body>
</html>`;
}

function renderTitlePage(metadata) {
  if (!metadata.title && !metadata.author) {
    return "";
  }

  const author = metadata.author ? `<p>by ${escapeHtml(metadata.author)}</p>` : "";
  const draft = metadata.draft ? `<p>${escapeHtml(metadata.draft)} draft</p>` : "";

  return `<section class="title-page">
      <div>
        <h1>${escapeHtml(metadata.title || "Untitled")}</h1>
        ${author}
        ${draft}
      </div>
    </section>`;
}

function renderBlock(block) {
  switch (block.type) {
    case "section":
      return `<h${block.level} class="section">${escapeHtml(block.text)}</h${block.level}>`;
    case "scene":
      return `<p class="scene">${escapeHtml(block.heading)}</p>`;
    case "action":
      return `<p class="action">${escapeHtml(block.text)}</p>`;
    case "dialogue":
      return renderDialogue(block);
    case "shot":
      return `<p class="shot">${escapeHtml(block.text)}</p>`;
    case "transition":
      return `<p class="transition">${escapeHtml(block.text)}</p>`;
    case "note":
      return `<aside class="note">${escapeHtml(block.text)}</aside>`;
    default:
      return "";
  }
}

function renderDialogue(block) {
  if (block.dual) {
    return `<div class="dual-dialogue">
      ${renderSingleDialogue(block.character, block.extension, block.lines)}
      ${renderSingleDialogue(block.dual.character, block.dual.extension, block.dual.lines)}
    </div>`;
  }

  return renderSingleDialogue(block.character, block.extension, block.lines);
}

function renderSingleDialogue(character, extension, lines) {
  const cue = extension ? `${character} (${extension})` : character;
  const renderedLines = lines.map(renderDialogueLine).join("\n");

  return `<div class="dialogue">
      <p class="cue">${escapeHtml(cue)}</p>
      ${renderedLines}
    </div>`;
}

function renderDialogueLine(line) {
  const className = line.type === "parenthetical" ? "parenthetical" : "speech";
  const text = line.type === "parenthetical" ? `(${line.text})` : line.text;
  return `<p class="${className}">${escapeHtml(text)}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
