const inputText = document.getElementById("inputText");
const lockToTitleCase = document.getElementById("lockToTitleCase");
const modeSelect = document.getElementById("modeSelect");
const output = document.getElementById("nameplateOutput");
const copyBtn = document.getElementById("copyBtn");

const WORD_CHAR = /[\p{L}\p{N}]/u;
const LETTER = /\p{L}/u;
const VOWEL = /[aeiouy]/i;
const CORE_VOWEL = /[aeiou]/i;
const DIGRAPH_PREFIXES = ["sh", "ch", "th", "ph", "wh", "qu", "gh", "kh", "ts"];
const ONSET_CLUSTERS = new Set([
  "bl",
  "br",
  "ch",
  "cl",
  "cr",
  "dr",
  "fl",
  "fr",
  "gl",
  "gr",
  "pl",
  "pr",
  "sc",
  "sh",
  "sk",
  "sl",
  "sm",
  "sn",
  "sp",
  "st",
  "sw",
  "th",
  "tr",
  "tw",
  "wh",
  "wr",
]);

function toTitleCase(value) {
  return value.replace(/[\p{L}\p{N}]+/gu, (token) => {
    if (token.toUpperCase() === token || token.length === 1) {
      return token[0].toUpperCase() + token.slice(1).toLowerCase();
    }
    return token[0].toUpperCase() + token.slice(1);
  });
}

function firstLetterIndex(chars) {
  for (let i = 0; i < chars.length; i += 1) {
    if (LETTER.test(chars[i])) {
      return i;
    }
  }
  return -1;
}

function firstVowelIndex(chars, startAt = 0) {
  for (let i = startAt; i < chars.length; i += 1) {
    if (LETTER.test(chars[i]) && VOWEL.test(chars[i])) {
      return i;
    }
  }
  return -1;
}

function isVowelAt(chars, index) {
  const current = chars[index];
  if (!current || !LETTER.test(current)) {
    return false;
  }

  const lower = current.toLowerCase();
  if (CORE_VOWEL.test(lower)) {
    return true;
  }

  if (lower !== "y") {
    return false;
  }

  if (index === 0 || index === chars.length - 1) {
    return false;
  }

  const prev = chars[index - 1]?.toLowerCase() ?? "";
  return !CORE_VOWEL.test(prev);
}

function collectVowelGroups(chars) {
  const groups = [];
  let i = 0;

  while (i < chars.length) {
    if (!isVowelAt(chars, i)) {
      i += 1;
      continue;
    }

    const start = i;
    i += 1;
    while (i < chars.length && isVowelAt(chars, i)) {
      i += 1;
    }

    groups.push({ start, end: i - 1 });
  }

  return groups;
}

function trimSilentTerminalE(chars, groups) {
  if (groups.length <= 1) {
    return groups;
  }

  const last = groups[groups.length - 1];
  const lastChar = chars[chars.length - 1]?.toLowerCase();
  const prevChar = chars[chars.length - 2]?.toLowerCase();

  if (
    chars.length > 3 &&
    lastChar === "e" &&
    last.start === chars.length - 1 &&
    prevChar &&
    !CORE_VOWEL.test(prevChar)
  ) {
    return groups.slice(0, -1);
  }

  return groups;
}

function pickStartFromConsonantGap(chars, gapStart, gapEnd) {
  const count = gapEnd - gapStart + 1;
  if (count <= 0) {
    return gapEnd + 1;
  }

  if (count === 1) {
    return gapStart;
  }

  const cluster = chars
    .slice(gapStart, gapEnd + 1)
    .join("")
    .toLowerCase();

  if (count === 2) {
    return ONSET_CLUSTERS.has(cluster) ? gapStart : gapEnd;
  }

  const lastTwo = cluster.slice(-2);
  return ONSET_CLUSTERS.has(lastTwo) ? gapEnd - 1 : gapEnd;
}

function syllableStarts(chars) {
  const first = firstLetterIndex(chars);
  if (first < 0) {
    return [];
  }

  let groups = collectVowelGroups(chars);
  groups = trimSilentTerminalE(chars, groups);

  if (groups.length <= 1) {
    return [first];
  }

  const starts = [first];
  for (let i = 1; i < groups.length; i += 1) {
    const prev = groups[i - 1];
    const next = groups[i];
    const gapStart = prev.end + 1;
    const gapEnd = next.start - 1;

    if (gapStart > gapEnd) {
      starts.push(next.start);
      continue;
    }

    starts.push(pickStartFromConsonantGap(chars, gapStart, gapEnd));
  }

  return [...new Set(starts)].filter((start) => start >= 0);
}

function pickSyllableBoundaryAnchor(chars) {
  const starts = syllableStarts(chars).filter((start) => start > 0);
  if (starts.length === 0) {
    return -1;
  }

  if (starts.length === 1) {
    return starts[0];
  }

  const target = Math.round(chars.length * 0.58);
  let best = starts[0];
  let bestScore = Math.abs(best - target);

  for (let i = 1; i < starts.length; i += 1) {
    const score = Math.abs(starts[i] - target);
    if (score < bestScore) {
      best = starts[i];
      bestScore = score;
    }
  }

  return best;
}

function pickAdaptivePrimary(chars) {
  const base = firstLetterIndex(chars);
  if (base < 0) {
    return -1;
  }

  const lower = chars.join("").toLowerCase();
  const digraph = DIGRAPH_PREFIXES.find((prefix) => lower.startsWith(prefix));
  if (!digraph || chars.length < 5) {
    if (VOWEL.test(chars[0]) && chars.length >= 6) {
      for (let i = 1; i < chars.length; i += 1) {
        if (LETTER.test(chars[i]) && !VOWEL.test(chars[i])) {
          return i;
        }
      }
    }

    return base;
  }

  const vowel = firstVowelIndex(chars, digraph.length);
  return vowel >= 0 ? vowel : base;
}

function pickAdaptiveSecondary(chars, primaryIndex) {
  if (chars.length < 8 || primaryIndex < 0) {
    return -1;
  }

  if (primaryIndex !== firstLetterIndex(chars)) {
    return -1;
  }

  const target = Math.round(chars.length * 0.55);
  let bestIndex = -1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let i = primaryIndex + 2; i < chars.length - 1; i += 1) {
    if (!LETTER.test(chars[i])) {
      continue;
    }

    const score = Math.abs(i - target) + (VOWEL.test(chars[i]) ? 0.9 : 0);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function anchorsForWord(word, mode) {
  const chars = [...word];
  const anchors = new Set();

  if (mode === "classic") {
    const first = firstLetterIndex(chars);
    if (first >= 0) {
      anchors.add(first);
    }
    return anchors;
  }

  if (mode === "syllable") {
    const boundary = pickSyllableBoundaryAnchor(chars);
    if (boundary >= 0) {
      anchors.add(boundary);
    }
    return anchors;
  }

  const primary = pickAdaptivePrimary(chars);
  if (primary >= 0) {
    anchors.add(primary);
  }

  const secondary = pickAdaptiveSecondary(chars, primary);
  if (secondary >= 0) {
    anchors.add(secondary);
  }

  return anchors;
}

function collectInvertedIndexes(text, mode) {
  const chars = [...text];
  const inverted = new Set();

  let i = 0;
  while (i < chars.length) {
    if (!WORD_CHAR.test(chars[i])) {
      i += 1;
      continue;
    }

    const start = i;
    while (i < chars.length && WORD_CHAR.test(chars[i])) {
      i += 1;
    }

    const word = chars.slice(start, i).join("");
    const localAnchors = anchorsForWord(word, mode);
    localAnchors.forEach((localIndex) => {
      inverted.add(start + localIndex);
    });
  }

  return { chars, inverted };
}

function renderNameplate() {
  let text = inputText.value;
  if (lockToTitleCase.checked) {
    text = toTitleCase(text);
  }

  if (!text.trim()) {
    text = "Gentle-Looking Mother";
  }

  const selectedMode = modeSelect.value;
  const mode = ["classic", "adaptive", "syllable"].includes(selectedMode)
    ? selectedMode
    : "syllable";

  const { chars, inverted } = collectInvertedIndexes(text, mode);

  output.innerHTML = "";
  chars.forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "char";
    if (inverted.has(index)) {
      span.classList.add("inverse");
    }
    span.textContent = char;
    output.appendChild(span);
  });
}

inputText.addEventListener("input", renderNameplate);
lockToTitleCase.addEventListener("change", renderNameplate);
modeSelect.addEventListener("change", renderNameplate);

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(inputText.value);
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy plain text";
    }, 1000);
  } catch {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy plain text";
    }, 1000);
  }
});

renderNameplate();
