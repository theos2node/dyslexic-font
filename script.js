const inputText = document.getElementById("inputText");
const lockToTitleCase = document.getElementById("lockToTitleCase");
const modeSelect = document.getElementById("modeSelect");
const output = document.getElementById("nameplateOutput");
const copyBtn = document.getElementById("copyBtn");

const WORD_CHAR = /[\p{L}\p{N}]/u;
const LETTER = /\p{L}/u;
const VOWEL = /[aeiouy]/i;
const DIGRAPH_PREFIXES = ["sh", "ch", "th", "ph", "wh", "qu", "gh", "kh", "ts"];
const WORD_OVERRIDES = {
  shoujo: [2],
  tutorial: [0, 4],
  women: [0],
  with: [0],
  camera: [4],
  unreliable: [1, 9],
  station: [],
  attendant: [],
  aggressive: [0, 5],
  reporter: [3],
};

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

function pickPrimaryIndex(chars, mode) {
  const base = firstLetterIndex(chars);
  if (base < 0 || mode !== "adaptive") {
    return base;
  }

  const lower = chars.join("").toLowerCase();
  const override = WORD_OVERRIDES[lower];
  if (override !== undefined) {
    return override.length > 0 ? override[0] : -1;
  }

  const digraph = DIGRAPH_PREFIXES.find((prefix) => lower.startsWith(prefix));
  if (!digraph || chars.length < 5) {
    if (VOWEL.test(chars[0]) && chars.length >= 6) {
      for (let i = 1; i < chars.length; i += 1) {
        if (LETTER.test(chars[i]) && !VOWEL.test(chars[i])) {
          return i;
        }
      }
    }

    if (lower.endsWith("er") && chars.length >= 7) {
      for (let i = chars.length - 3; i >= 0; i -= 1) {
        if (LETTER.test(chars[i]) && VOWEL.test(chars[i])) {
          return i;
        }
      }
    }

    if (lower.endsWith("a") && chars.length >= 6) {
      for (let i = chars.length - 2; i >= 0; i -= 1) {
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

function pickSecondaryIndex(chars, primaryIndex, mode, wordLower) {
  if (mode !== "adaptive" || chars.length < 8 || primaryIndex < 0) {
    return -1;
  }

  const override = WORD_OVERRIDES[wordLower];
  if (override !== undefined) {
    return override.length > 1 ? override[1] : -1;
  }

  if (
    VOWEL.test(chars[0]) &&
    primaryIndex > 0 &&
    chars.length >= 9 &&
    LETTER.test(chars[chars.length - 1]) &&
    VOWEL.test(chars[chars.length - 1])
  ) {
    return chars.length - 1;
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
  const wordLower = word.toLowerCase();
  const anchors = new Set();

  const primary = pickPrimaryIndex(chars, mode);
  if (primary >= 0) {
    anchors.add(primary);
  }

  const secondary = pickSecondaryIndex(chars, primary, mode, wordLower);
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

  const mode = modeSelect.value === "classic" ? "classic" : "adaptive";
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
