# living-aegis-prototype

`living-aegis-prototype` is the prototype lab for experiments related to
Living Aegis Origin.

This repository is not the main game repository. The main game is managed in
`living-aegis-origin`, and the simulator is managed separately in
`living-aegis-simulator`.

## Purpose

This repository holds small, independent prototype experiments for Living Aegis
Origin. The root `index.html` is a launcher page, not a game screen. It lists
available prototypes and links to each standalone prototype folder.

## Running Locally

Open `index.html` in a browser to view the prototype launcher.

From the launcher, open:

```text
prototype-01-basic-defense/
```

Each prototype is designed to run as a static page without a build step.

## GitHub Pages

The repository uses simple HTML, CSS, and JavaScript so the root launcher page
and each prototype folder can be served directly by GitHub Pages.

## Adding Prototypes

Add each new prototype in its own folder, then update:

- `index.html`
- `PROTOTYPE_INDEX.md`
- `CHANGELOG.md`

Prototype folders should remain independent unless a future decision log entry
explicitly changes that structure.
