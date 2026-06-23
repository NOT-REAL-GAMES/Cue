import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parse } from "../src/parser.js";

describe("Cue parser", () => {
  it("parses metadata, sections, scenes, action, dialogue, shots, notes, and transitions", () => {
    const document = parse(`---
title: An Ordinary Door
author: Rae Bell
---

# ACT ONE

.INT. KITCHEN - MORNING

The kettle screams.

@MARA (V.O.)
(softly)
Not today.

! CLOSE ON: THE DOOR

[[Make this practical.]]

> CUT TO:
`);

    assert.equal(document.metadata.title, "An Ordinary Door");
    assert.deepEqual(
      document.blocks.map((block) => block.type),
      ["section", "scene", "action", "dialogue", "shot", "note", "transition"]
    );
    assert.equal(document.blocks[1].heading, "INT. KITCHEN - MORNING");
    assert.equal(document.blocks[3].character, "MARA");
    assert.equal(document.blocks[3].extension, "V.O.");
    assert.equal(document.blocks[3].lines[0].type, "parenthetical");
  });

  it("parses dual dialogue", () => {
    const document = parse(`@MARA ^ @JON
Open it.
===
Absolutely not.
`);

    const dialogue = document.blocks[0];
    assert.equal(dialogue.type, "dialogue");
    assert.equal(dialogue.character, "MARA");
    assert.equal(dialogue.dual.character, "JON");
    assert.equal(dialogue.lines[0].text, "Open it.");
    assert.equal(dialogue.dual.lines[0].text, "Absolutely not.");
  });

  it("keeps source comments in the AST", () => {
    const document = parse(`// tighten later
Rain on glass.
`);

    assert.equal(document.blocks[0].type, "comment");
    assert.equal(document.blocks[0].text, "tighten later");
    assert.equal(document.blocks[1].type, "action");
  });

  it("folds single newlines inside action paragraphs", () => {
    const document = parse(`Rain stipples the windshield.
The wipers keep missing the same crescent of glass.

The car does not slow down.
`);

    assert.equal(document.blocks[0].type, "action");
    assert.equal(
      document.blocks[0].text,
      "Rain stipples the windshield. The wipers keep missing the same crescent of glass."
    );
    assert.equal(document.blocks[1].type, "action");
    assert.equal(document.blocks[1].text, "The car does not slow down.");
  });
});
