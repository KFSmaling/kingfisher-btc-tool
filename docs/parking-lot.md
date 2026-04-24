# Parking lot — open technische items

---

## Theming

**StrategyOnePager.jsx — C-object constanten**

Twee hardcoded hex-waardes (`#00AEEF` als `blue`, `#2c7a4b` als `greenDk`) in het `C`-object worden gebruikt met template literals die opacity-suffixes appenden (`${C.blue}20`, `${C.blue}30`). Kan niet mechanisch vervangen worden door CSS-variabelen — `var(--color-analysis)20` is ongeldige CSS. Oplossing in latere stap via `color-mix()` of rgba-varianten.

Locatie: `src/features/strategie/StrategyOnePager.jsx` regels 20–21.
