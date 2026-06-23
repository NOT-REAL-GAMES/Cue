# Cue

Cue is a Markdown-style markup language for screenwriting. It is plain text first: readable while you write, structured enough for tools, and intentionally close to the way screenplays already look on the page.

The name is short for actor cues, sound cues, camera cues, and the moment a scene begins. It is warmer and more memorable than ScreenMark while still fitting the project.

## Quick Example

```cue
---
title: An Ordinary Door
author: Rae Bell
draft: First
---

# ACT ONE

.INT. KITCHEN - MORNING

A kettle screams on a spotless stove.

@MARA
(under her breath)
Not today.

! CLOSE ON: THE BACK DOOR

The handle turns by itself.

> CUT TO:
```

## Core Syntax

Cue keeps structural markers small and predictable:

| Syntax | Meaning |
| --- | --- |
| `---` front matter | Script metadata |
| `# ACT ONE` | Section heading |
| `.INT. HOUSE - NIGHT` | Scene heading |
| Plain paragraphs | Action |
| `@MARA` | Character cue |
| `(quietly)` | Dialogue parenthetical |
| `@MARA ^ @JON` plus `===` | Dual dialogue |
| `! CLOSE ON: THE KEY` | Shot |
| `> CUT TO:` | Transition |
| `[[note text]]` | Production or writer note |
| `// comment` | Source-only comment |

See [docs/spec.md](docs/spec.md) for the full language draft.

## Try It

Parse a script to JSON:

```sh
npm run parse -- examples/ordinary-door.cue
```

On Windows, you can also drag one or more `.cue` files onto `parse-cue.bat`.
It writes `.json` and `.html` files next to each dropped script.

Render HTML:

```sh
npm run html -- examples/ordinary-door.cue -o ordinary-door.html
```

Live preview:

```sh
npm run preview -- examples/ordinary-door.cue --open
```

In Zed, open a `.cue` file and run `task: spawn`, then choose `Cue: Live Preview Current File`.
The task renders the current script to a neighboring `.html` file, starts a local preview server, opens it in your browser, and refreshes it whenever the source file is saved.

Run tests:

```sh
npm test
```

## Design Goals

- Readable source that still looks like a screenplay.
- Markdown-like headings, blockquote transitions, and front matter.
- Explicit cues where screenplay formatting is ambiguous.
- A small AST suitable for renderers, linters, editors, and converters.
