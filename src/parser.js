const sceneHeadingPattern = /^(?:\.)?(INT\.\/EXT\.|INT\/EXT\.|INT\.|EXT\.|I\/E\.|EST\.)\s+(.+)$/i;
const sectionPattern = /^(#{1,6})\s+(.+)$/;
const cuePattern = /^@(.+?)(?:\s+\^\s+@?(.+))?$/;

export function parse(source, options = {}) {
  const filename = options.filename ?? null;
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const document = {
    type: "document",
    format: "cue",
    version: "0.1",
    filename,
    metadata: {},
    blocks: []
  };

  let index = 0;

  if (lines[index]?.trim() === "---") {
    const frontMatter = parseFrontMatter(lines, index);
    document.metadata = frontMatter.metadata;
    index = frontMatter.nextIndex;
  }

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (line === "") {
      index += 1;
      continue;
    }

    const section = parseSection(line, index);
    if (section) {
      document.blocks.push(section);
      index += 1;
      continue;
    }

    const scene = parseSceneHeading(line, index);
    if (scene) {
      document.blocks.push(scene);
      index += 1;
      continue;
    }

    const dialogueCue = parseDialogueCue(line);
    if (dialogueCue) {
      const dialogue = parseDialogue(lines, index, dialogueCue);
      document.blocks.push(dialogue.block);
      index = dialogue.nextIndex;
      continue;
    }

    const shot = parseShot(line, index);
    if (shot) {
      document.blocks.push(shot);
      index += 1;
      continue;
    }

    const transition = parseTransition(line, index);
    if (transition) {
      document.blocks.push(transition);
      index += 1;
      continue;
    }

    const note = parseNote(line, index);
    if (note) {
      document.blocks.push(note);
      index += 1;
      continue;
    }

    const comment = parseComment(line, index);
    if (comment) {
      document.blocks.push(comment);
      index += 1;
      continue;
    }

    const action = parseAction(lines, index);
    document.blocks.push(action.block);
    index = action.nextIndex;
  }

  return document;
}

function parseFrontMatter(lines, startIndex) {
  const metadata = {};
  let index = startIndex + 1;

  while (index < lines.length && lines[index].trim() !== "---") {
    const line = lines[index];
    const separator = line.indexOf(":");

    if (separator > -1) {
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();

      if (key) {
        metadata[key] = value;
      }
    }

    index += 1;
  }

  if (lines[index]?.trim() === "---") {
    index += 1;
  }

  return { metadata, nextIndex: index };
}

function parseSection(line, index) {
  const match = line.match(sectionPattern);

  if (!match) {
    return null;
  }

  return {
    type: "section",
    line: index + 1,
    level: match[1].length,
    text: match[2].trim()
  };
}

function parseSceneHeading(line, index) {
  const match = line.match(sceneHeadingPattern);

  if (!match) {
    return null;
  }

  return {
    type: "scene",
    line: index + 1,
    heading: line.replace(/^\./, ""),
    prefix: match[1].toUpperCase(),
    location: match[2].trim()
  };
}

function parseDialogueCue(line) {
  const match = line.match(cuePattern);

  if (!match) {
    return null;
  }

  return {
    character: parseCharacter(match[1]),
    dualCharacter: match[2] ? parseCharacter(match[2]) : null
  };
}

function parseCharacter(value) {
  const text = value.trim();
  const extensionMatch = text.match(/^(.+?)\s+(\([^)]+\))$/);

  if (!extensionMatch) {
    return { name: text, extension: null };
  }

  return {
    name: extensionMatch[1].trim(),
    extension: extensionMatch[2].slice(1, -1).trim()
  };
}

function parseDialogue(lines, startIndex, cue) {
  const block = {
    type: "dialogue",
    line: startIndex + 1,
    character: cue.character.name,
    extension: cue.character.extension,
    lines: []
  };

  if (cue.dualCharacter) {
    block.dual = {
      character: cue.dualCharacter.name,
      extension: cue.dualCharacter.extension,
      lines: []
    };
  }

  let target = block.lines;
  let index = startIndex + 1;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (line === "") {
      index += 1;
      break;
    }

    if (block.dual && line === "===") {
      target = block.dual.lines;
      index += 1;
      continue;
    }

    if (isBlockStart(line)) {
      break;
    }

    target.push(parseDialogueLine(line, index));
    index += 1;
  }

  return { block, nextIndex: index };
}

function parseDialogueLine(line, index) {
  if (/^\(.+\)$/.test(line)) {
    return {
      type: "parenthetical",
      line: index + 1,
      text: line.slice(1, -1).trim()
    };
  }

  return {
    type: "speech",
    line: index + 1,
    text: line
  };
}

function parseShot(line, index) {
  if (!line.startsWith("!")) {
    return null;
  }

  return {
    type: "shot",
    line: index + 1,
    text: line.slice(1).trim()
  };
}

function parseTransition(line, index) {
  if (!line.startsWith(">")) {
    return null;
  }

  return {
    type: "transition",
    line: index + 1,
    text: line.slice(1).trim()
  };
}

function parseNote(line, index) {
  const match = line.match(/^\[\[(.+)\]\]$/);

  if (!match) {
    return null;
  }

  return {
    type: "note",
    line: index + 1,
    text: match[1].trim()
  };
}

function parseComment(line, index) {
  if (!line.startsWith("//")) {
    return null;
  }

  return {
    type: "comment",
    line: index + 1,
    text: line.slice(2).trim()
  };
}

function parseAction(lines, startIndex) {
  const actionLines = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (line === "" || isBlockStart(line)) {
      break;
    }

    actionLines.push(line);
    index += 1;
  }

  return {
    block: {
      type: "action",
      line: startIndex + 1,
      text: actionLines.join(" ")
    },
    nextIndex: index
  };
}

function isBlockStart(line) {
  return Boolean(
    parseSection(line, 0) ||
      parseSceneHeading(line, 0) ||
      parseDialogueCue(line) ||
      parseShot(line, 0) ||
      parseTransition(line, 0) ||
      parseNote(line, 0) ||
      parseComment(line, 0)
  );
}
