# Gorave Website — design canvas

Zero-install hi-fi design board. Open in any browser via a static server.

## Run

```bash
python -m http.server 8765
# or: npx serve -p 8765
```

Open: http://localhost:8765/index.html

## Add a frame

```bash
cp ~/.claude/skills/canvas-design/templates/frames/_template.jsx frames/<name>.jsx
```

Then in `index.html`:

1. Add `<script type="text/babel" src="frames/<name>.jsx?v=1"></script>` after the existing frame imports
2. Add a new `<DCSection>` mounting the new component(s)
3. Bump `?v=N` on any file you edit

## Layout

```
.
├── index.html              ← entry (edit project title + add frame imports)
├── design-canvas.jsx       ← runtime (don't edit)
├── tokens.css              ← design system (edit to retheme)
└── frames/
    └── hello.jsx           ← starter frame
```

## Conventions

- **No `import`** — React, DC primitives, window globals
- **Expose via `window.X = X`** at the bottom of every frame
- **Inline `style={{}}`** — there is no Tailwind build
- **Theme function** for light/dark (extend with `system` for multi-brand)
- **Cache-bust** with `?v=N` on script tags after edits
