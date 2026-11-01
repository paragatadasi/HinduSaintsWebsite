# SPN display palette · 1 November 2026

Reviewed source: `spn-display-regions-2026-11-01-v4`. New display-only tokens preserve canonical tradition colors. The earlier reviewer used museum-region tokens (and gold for global context); the companion also had stale case overrides. Both now use one physical-case mapping.

| Token | Previous | Approved value |
|---|---|---|
| `--color-spn-display-n-fill` | Not defined | `oklch(0.95 0.024 285)` |
| `--color-spn-display-n-edge` | Not defined | `oklch(0.65 0.070 285)` |
| `--color-spn-display-n-solid` | Not defined | `oklch(0.55 0.100 285)` |
| `--color-spn-display-b-fill` | Not defined | `oklch(0.95 0.025 145)` |
| `--color-spn-display-b-edge` | Not defined | `oklch(0.65 0.070 145)` |
| `--color-spn-display-b-solid` | Not defined | `oklch(0.55 0.100 145)` |
| `--color-spn-display-e-fill` | Not defined | `oklch(0.95 0.025 220)` |
| `--color-spn-display-e-edge` | Not defined | `oklch(0.65 0.070 220)` |
| `--color-spn-display-e-solid` | Not defined | `oklch(0.55 0.100 220)` |
| `--color-spn-display-w-fill` | Not defined | `oklch(0.95 0.025 75)` |
| `--color-spn-display-w-edge` | Not defined | `oklch(0.65 0.070 75)` |
| `--color-spn-display-w-solid` | Not defined | `oklch(0.55 0.100 75)` |
| `--color-spn-display-s-fill` | Not defined | `oklch(0.95 0.024 25)` |
| `--color-spn-display-s-edge` | Not defined | `oklch(0.65 0.070 25)` |
| `--color-spn-display-s-solid` | Not defined | `oklch(0.55 0.100 25)` |
| `--color-spn-display-k-fill` | Not defined | `oklch(.95 0 0)` |
| `--color-spn-display-k-edge` | Not defined | `oklch(.65 0 0)` |
| `--color-spn-display-k-solid` | Not defined | `oklch(.55 0 0)` |
| `--color-spn-display-c-fill` | Not defined | `oklch(.95 0 0)` |
| `--color-spn-display-c-edge` | Not defined | `oklch(.65 0 0)` |
| `--color-spn-display-c-solid` | Not defined | `oklch(.55 0 0)` |
| `--color-spn-display-be-fill` | Not defined | `oklch(0.95 0.025 182.5)` |
| `--color-spn-display-be-edge` | Not defined | `oklch(0.65 0.070 182.5)` |
| `--color-spn-display-be-solid` | Not defined | `oklch(0.55 0.098 182.5)` |
| `--color-spn-display-en-fill` | Not defined | `oklch(0.95 0.024 252.5)` |
| `--color-spn-display-en-edge` | Not defined | `oklch(0.65 0.070 252.5)` |
| `--color-spn-display-en-solid` | Not defined | `oklch(0.55 0.100 252.5)` |
| `--color-spn-display-sw-fill` | Not defined | `oklch(0.95 0.025 50)` |
| `--color-spn-display-sw-edge` | Not defined | `oklch(0.65 0.070 50)` |
| `--color-spn-display-sw-solid` | Not defined | `oklch(0.55 0.100 50)` |
| `--color-spn-display-r-fill` | Not defined | `oklch(.95 0 0)` |
| `--color-spn-display-r-edge` | Not defined | `oklch(.65 0 0)` |
| `--color-spn-display-r-solid` | Not defined | `oklch(.55 0 0)` |

Fill/edge/solid roles keep a fixed hue per region. Gray K/C remain separately labeled; BE, EN and SW are reviewed midpoint hues, not blended holdings. Dark room maps derive their surfaces from edge tokens and the existing dark surface. Parchment maps use the approved fills. Text remains the theme foreground rather than the lighter regional edge.

Reference validation: all approved fills are sRGB; the source palette reports body-text contrast above 13:1 on its light ground. Production text and selected-state outlines retain theme tokens.
