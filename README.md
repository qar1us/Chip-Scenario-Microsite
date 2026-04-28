# Chip Scenario Microsite

A single-page microsite presenting a scenario on how compute access shapes nation-state cyber capability.

## Scenario

**Compute as Strategic Cyber Resource** — Compute becomes a decisive resource for cyber operations against highly strategic targets. As the capabilities floor rises and less sophisticated actors gain access to advanced cyber tools, vast compute reserves let nation-states stay a tier above cybercriminals and outpace many AI-enabled defenders.

## Local preview

No build step. Open `index.html` directly, or run a local server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

Deployed via GitHub Pages from the `main` branch. To enable:

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch**, Branch: **main / (root)**
3. Site goes live at `https://qar1us.github.io/Chip-Scenario-Microsite/`

## Structure

```
.
├── index.html      # Single-page site (hero + 5 scenarios)
├── styles.css      # Editorial dark theme, sticky nav, sidenotes
├── script.js       # Scroll-spy nav, sidenote toggle
└── README.md
```

## Scenarios

1. **Cyber** — *Compute as a Strategic Cyber Resource* (filled)
2. **Economic Power** (placeholder, awaiting copy)
3. **Distillation** (placeholder, awaiting copy)

## Authoring notes

- Add a sidenote: `<span class="sn-ref" data-sn="N">N</span>` inline, then `<aside class="sidenote" data-sn="N"><sup>N</sup> Note text.</aside>` inside the same paragraph or list item.
- Sidenotes float in the right margin on wide screens and collapse to inline expandable notes on narrow screens.
