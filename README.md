# dyslexic-font

A lightweight GitHub Pages app that recreates the Persona-style speaker tag effect from your screenshot:

- White nameplate with bold black border.
- Serif text.
- Black-background/white-text letter blocks.
- Two modes:
  - `Classic`: first letter after segment boundaries.
  - `Adaptive`: heuristic anchors for easier scanning (for example, `tutorial` can produce `T` + `R`, and digraph-led words like `shoujo` can anchor on `O`).

## What was implemented

- `index.html`: input + live preview UI.
- `styles.css`: nameplate visual treatment and responsive layout.
- `script.js`: text transform and rendering logic.

## Placement rules

`Classic` mode:

1. Invert the first letter at string start.
2. Invert the first letter after a space.
3. Invert the first letter after `-`.

This matches your provided screenshot behavior (`Gentle-Looking Mother` -> `G`, `L`, `M`).

`Adaptive` mode:

1. Uses classic segment starts as baseline.
2. For digraph-led words (`sh`, `ch`, `th`, etc.), anchors can shift to the first vowel after the digraph.
3. For longer words, adds a second anchor around the middle-right of the word (consonant-biased).
4. Includes learned overrides from your examples (for instance `shoujo`, `tutorial`, `women with camera`, `unreliable station attendant`, `aggressive reporter` patterns).

## Research notes

This repo uses the high-contrast segment-initial inversion because it mirrors the game UI style and your observed readability benefit, while avoiding unsupported claims that it is universally better for all dyslexic readers.

Sources:

1. Persona UI design note about using reverse-color characters as a visual anchor: [Character Design References](https://www.characterdesignreferences.com/art-of-animation-6/how-persona-5-transforms-generic-menus-into-exciting-ui-moments)
2. Controlled study on Bionic Reading found no overall statistically significant improvement in speed, accuracy, or comprehension: [Applied Sciences 2025](https://www.mdpi.com/2673-8392/5/3/124)
3. Study on specialized dyslexia fonts reports font choice alone is not a universal fix: [Dyslexia and Fonts (2018)](https://journals.sagepub.com/doi/10.1177/0022219418771660)

## GitHub Pages

This repository is static and ready for GitHub Pages from `main` branch root.

If Pages is already enabled, the site should publish automatically after push.
