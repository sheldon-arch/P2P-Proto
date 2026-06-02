# Design Tokens and Status-Color Map

The neutral visual skin. Raphe's structure, our own clean design language. These are the tokens every component reads; changing a token reskins the whole prototype without touching a screen. Expressed as CSS variables / Tailwind theme so shadcn components consume them directly.

This is deliberately a fresh, neutral identity (per [[ui-direction-decisions]]: Raphe-inspired, cleaned up), not Raphe's aerospace palette. The goal is a calm, professional, dense-enough enterprise look that reads as its own product.

## Color

Neutral, low-chroma base with a single brand accent and a semantic status set. Light theme is the default for the demo; a dark theme can follow from the same tokens.

### Base (surfaces and text)
| Token | Light value (guide) | Use |
| --- | --- | --- |
| `--background` | near-white (#FAFAFA) | app background |
| `--surface` | white (#FFFFFF) | cards, tables, sheets |
| `--surface-muted` | #F4F4F5 | table header, hover, secondary panels |
| `--border` | #E4E4E7 | dividers, input borders |
| `--foreground` | #18181B | primary text |
| `--foreground-muted` | #71717A | secondary text, captions, helper |
| `--foreground-subtle` | #A1A1AA | placeholders, disabled |

### Brand accent (one, used sparingly)
| Token | Value (guide) | Use |
| --- | --- | --- |
| `--primary` | a deep neutral blue (#1E3A5F or similar), our own, not Raphe's | primary buttons, active nav, focus ring, links |
| `--primary-foreground` | white | text on primary |
| `--primary-muted` | tint of primary (#EAF0F6) | active-nav background, selected row |

One accent only. Status colors carry meaning; the brand color carries identity and never doubles as a status.

### Semantic status palette (the basis of the status-color map below)
| Token | Value (guide) | Meaning |
| --- | --- | --- |
| `--neutral` / bg / fg | grey | informational, no urgency |
| `--info` | blue (distinct from brand) | in a known state, FYI |
| `--progress` | amber/yellow | in-flight, working |
| `--success` | green | done, healthy, approved |
| `--warning` | orange | needs attention, soft exception |
| `--danger` | red | blocked, failed, hard exception |
| `--muted` | grey, low-emphasis | terminal/inactive (cancelled, offboarded) |

Each status token has a background, a foreground, and a border variant for Badge, row tint, and banner use. Status is never conveyed by color alone (the Badge always carries text).

## Type

| Token | Value | Use |
| --- | --- | --- |
| `--font-sans` | Inter (or system UI stack) | all UI text |
| `--font-mono` | JetBrains Mono / ui-monospace | identifiers, codes, amounts in tables |
| display / h1 | 24px / 600 | page titles |
| h2 | 18px / 600 | card and section headers |
| body | 14px / 400 | default |
| small | 13px / 400 | secondary, table cells |
| caption | 12px / 500 | labels, badges, helper |

Identifiers (`REQ-...`, `PO-...`), codes, and money in tables use the mono font so columns align and keys are scannable.

## Spacing, radius, elevation, density

- **Spacing scale:** 4px base (4, 8, 12, 16, 24, 32, 48). Card padding 24, table cell padding 12 vertical, form field gap 16.
- **Radius:** `--radius` 8px for cards and inputs, 6px for buttons and badges, full for avatars and pills. One consistent radius family.
- **Elevation:** flat by default; a single soft shadow for overlays (Dialog, Popover, Sheet) and the sticky topbar. Cards use a 1px border, not a shadow, for a clean enterprise look.
- **Density:** comfortable-but-compact. Tables default to a 40px row height; a density toggle (comfortable / compact) is available on heavy list screens. Forms are single-column within a section, two-column at >=1280px where the screen spec allows.

## Status-color map (binds the enum color tokens from the copy layer)

Every enum value in `../copy/01-enum-labels.md` carries a color token; this map binds that token to the semantic palette and to the shadcn `Badge` variant. A StatusBadge takes `(domain, rawValue)`, looks up the label + color token in the copy layer, and renders with the variant below. There is exactly one place this binding lives, so status colors are consistent across all 71 screens.

| Copy color token | Palette token | Badge variant | Row-tint use | Example values |
| --- | --- | --- | --- | --- |
| `success` | `--success` | green, solid-on-light | very light green left-border | Approved, Onboarded, Delivered, Paid, Completed, Grade A, Compliance passed |
| `progress` | `--progress` | amber | light amber | In progress, Ordered, Awaiting approval, Partially delivered, Pending installment, Grade B |
| `info` | `--info` | blue | none | Initiation, Approved (installment), Upcoming, Items/Spares/Services category |
| `warning` | `--warning` | orange | light orange | On hold, Partially approved, price-variance, qty-over, certificate expiring |
| `danger` | `--danger` | red | light red left-border | Suspended, Overdue, duplicate-invoice, quality-fail, Grade C, ASAP priority |
| `neutral` | `--neutral` | grey outline | none | Local/Import, Direct/Indirect, Net terms, match type, resolutions |
| `muted` | `--muted` | grey, low-emphasis | greyed row | Cancelled, Offboarded, Discontinued, Rescheduled, trade-program none |

Rules:
- A Badge is text + color, never color alone (accessibility, and it reads in a screenshot).
- Row tinting is reserved for states that need to jump out in a queue (danger and success left-border, muted greying); most rows are untinted to keep tables calm.
- The marquee rule visuals (the 9 inline banners in `../copy/03-messages.md`) use the same palette: duplicate-hold and budget-over and CAPA-near-suspend are `danger`; tolerance-amend and price-spike and cert-expiring and overdue and finance-revert are `warning`; the landed-cost-flip banner is `info` (it informs a decision, it is not an error).

## What is deliberately NOT Raphe

To keep this our own product: the brand accent, the exact palette values, the type choice (Raphe's specifics are not carried), the flat-border card style, and the density toggle are ours. What is carried from Raphe is the structure (where things sit, how a list/form/detail is composed, the nav shell), specified in the archetypes file, not the skin.
