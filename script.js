const inputText = document.getElementById("inputText");
const lockToTitleCase = document.getElementById("lockToTitleCase");
const output = document.getElementById("nameplateOutput");
const copyBtn = document.getElementById("copyBtn");

const WORD_CHAR = /[\p{L}\p{N}]/u;

function toTitleCase(value) {
  return value.replace(/[\p{L}\p{N}]+/gu, (token) => {
    if (token.toUpperCase() === token || token.length === 1) {
      return token[0].toUpperCase() + token.slice(1).toLowerCase();
    }
    return token[0].toUpperCase() + token.slice(1);
  });
}

function shouldInvert(chars, index) {
  if (!WORD_CHAR.test(chars[index])) {
    return false;
  }

  if (index === 0) {
    return true;
  }

  let prev = index - 1;
  while (prev >= 0 && /\s/u.test(chars[prev])) {
    prev -= 1;
  }

  if (prev < 0) {
    return true;
  }

  return chars[prev] === "-" || /\s/u.test(chars[prev]);
}

function renderNameplate() {
  let text = inputText.value;
  if (lockToTitleCase.checked) {
    text = toTitleCase(text);
  }

  if (!text.trim()) {
    text = "Gentle-Looking Mother";
  }

  output.innerHTML = "";
  const chars = [...text];

  chars.forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "char";
    if (shouldInvert(chars, index)) {
      span.classList.add("inverse");
    }
    span.textContent = char;
    output.appendChild(span);
  });
}

inputText.addEventListener("input", renderNameplate);
lockToTitleCase.addEventListener("change", renderNameplate);

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
