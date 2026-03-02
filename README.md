# Dyslexic Focus Text Lab

A full-screen GitHub Pages web app for writing and reading long text with contrast-based highlight anchors.

Live site: <https://theos2node.github.io/dyslexic-font/>

## Overview

This project provides a large writing area and a live rendered preview. The preview emphasizes selected letters using high-contrast blocks (`white text on black background`) to improve scanning.

## Features

- Full-screen, two-pane workspace (`Input` + `Preview`)
- Unlimited paragraph input
- Live rendering while typing
- Word and character counters
- Copy plain text button
- Responsive layout for desktop and mobile

## Highlight Modes

1. `Syllable Change` (default)
- Uses approximate syllable boundaries derived from vowel groups and consonant clusters.
- Highlights syllable-transition letters.
- For longer words, highlights multiple transitions.

2. `Adaptive`
- Uses visual-anchor heuristics tuned for quick scanning.
- Usually one anchor, sometimes two in longer words.

3. `Classic`
- Highlights the first letter of each word segment.

## Tech

- Plain HTML, CSS, and JavaScript
- No build tooling required
- Ready for GitHub Pages from `main` branch root

## Local Development

Open `index.html` directly, or run any static server in the repo root.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
