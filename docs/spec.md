# Cue Language Draft

Cue files use the `.cue` extension and UTF-8 plain text. The language borrows Markdown's low-ceremony feel while preserving screenplay-specific structure.

## Document Shape

A Cue document is a sequence of blocks:

1. Optional front matter.
2. Optional section headings.
3. Scene, action, dialogue, shot, transition, note, and comment blocks.

Blank lines separate blocks. Source comments are ignored by renderers but preserved by the parser.

## Front Matter

If a document begins with `---`, all lines until the next `---` are parsed as simple `key: value` metadata.

```cue
---
title: An Ordinary Door
author: Rae Bell
draft: First
---
```

## Sections

Markdown headings organize a script without forcing screenplay output.

```cue
# ACT ONE
## Sequence: The Missing Key
```

The heading level is preserved in the AST.

## Scene Headings

Scene headings begin with a location marker. A leading dot is recommended because it removes ambiguity and makes scene headings easy to scan.

```cue
.INT. KITCHEN - MORNING
.EXT. PIER - NIGHT
.INT./EXT. MOVING CAR - DAY
.EST. CITY SKYLINE - DAWN
```

The parser also accepts uppercase scene headings without the leading dot.

## Action

Any ordinary paragraph is action. Consecutive nonblank action lines are folded into a single paragraph, so writers can wrap source text for easier editing without forcing line breaks in rendered output. Use a blank line to start a new action paragraph.

```cue
Rain stipples the windshield.
The wipers keep missing the same crescent of glass.
```

## Dialogue

Character cues start with `@`. Dialogue continues until a blank line or the next block. Consecutive speech lines are folded into a single speech paragraph, so source text can be wrapped without forcing rendered line breaks.

```cue
@MARA
(trying to smile)
I brought the key.
```

This source:

```cue
@MARA
I wrapped this line
for easier editing.
```

renders as one speech paragraph.

Parentheticals are dialogue lines that begin with `(` and end with `)`.

Character extensions can be written directly after the name:

```cue
@MARA (V.O.)
The house remembered me first.
```

## Dual Dialogue

Dual dialogue uses `^` between two character cues. The `===` divider switches from the left speaker to the right speaker.

```cue
@MARA ^ @JON
Open it.
===
Absolutely not.
```

## Shots

Shots begin with `!`.

```cue
! CLOSE ON: THE DOORKNOB
! MATCH CUT TO: A SILVER RING
```

## Transitions

Transitions use Markdown-style blockquotes.

```cue
> CUT TO:
> FADE OUT.
```

## Notes

Notes are bracketed with double square brackets.

```cue
[[Check whether this prop returns in act three.]]
```

Renderers may hide notes, show them inline, or export them separately.

## Comments

Comments begin with `//`. They are for source-only reminders and are ignored by rendered output.

```cue
// Tighten this exchange after the table read.
```

## AST Blocks

The reference parser emits:

- `section`
- `scene`
- `action`
- `dialogue`
- `shot`
- `transition`
- `note`
- `comment`

Every block includes a 1-based `line` field.
