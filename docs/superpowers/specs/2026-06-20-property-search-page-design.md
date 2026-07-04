# Property Search Page — Design Spec
**Date:** 2026-06-20  
**File:** `services.html` (replaces current listings page)  
**Stack:** Pure HTML + CSS + JS, no frameworks

---

## Goal

Replace the current `services.html` with a production-ready real estate property search page that feels like a premium South Florida luxury brokerage — gold and black palette, clean Playfair Display typography, no template patterns.

---

## Color System

The page uses the **existing CSS variables** from `css/styles.css` so it inherits the site's light/dark theme toggle automatically (same `toggleTheme()` JS, same `data-theme` attribute on `<html>`).

Page-specific overrides layer on top using the same `[data-theme="dark"]` pattern.

**Dark theme (default visual direction — gold and black):**

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0d0d0d` | Page base (already in styles.css dark) |
| `--bg-surface` | `#151515` | Cards, search bar (already in styles.css dark) |
| `--accent` | `#c9a84c` | Gold — prices, badges, CTA, borders |
| `--accent-dim` | `rgba(201,168,76,0.12)` | Gold tints |
| `--text-primary` | `#f7f5f2` | Primary text |
| `--text-secondary` | `rgba(247,245,242,0.55)` | Muted text |

**Light theme (toggled via existing button):**

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#f7f5f2` | Warm off-white base |
| `--bg-surface` | `#ffffff` | Cards, search bar |
| `--accent` | `#9c7c3c` | Darkened gold (readable on light) |
| `--text-primary` | `#1a1714` | Dark text |
| `--text-secondary` | `#5b554e` | Secondary text |

All values already exist in `css/styles.css` — no new tokens needed. The hero photo overlay stays dark in both themes (it's a photo, not a CSS background).

---

## Typography

- **Display:** Playfair Display (400, 600, 700) — all headings
- **Body:** Instrument Sans (400, 500, 600) — body, labels, buttons, inputs
- Both loaded from Google Fonts
- Body `font-size: 1rem / line-height: 1.65`
- Headline fluid: `clamp(2.4rem, 5vw, 4.2rem)`

---

## Sections

### 1. Nav
Reuse the existing nav structure from `services.html` verbatim. The `active` class stays on the Listings link. Update font import to include Instrument Sans.

### 2. Hero
- Full-width section, `min-height: 85vh`
- Background: one Unsplash property photo (same sources as existing site), `background-size: cover`
- Overlay: `linear-gradient` from `rgba(0,0,0,0.72)` to `rgba(0,0,0,0.58)` — heavy enough to read text cleanly
- Content centered, `max-width: 860px`
- Eyebrow: `SOUTH FLORIDA REAL ESTATE` in gold, spaced caps, Instrument Sans
- H1: `"Find Your Home in South Florida"` in Playfair Display
- Sub: `"Browse active listings across Palm Beach, Boca Raton, Delray Beach, and beyond."` — muted off-white
- **Search bar:** a dark `#111111` pill-shaped or rounded card (`border-radius: 10px`, `border: 1px solid var(--gold-border)`) with four inline fields:
  - Location (text input with placeholder "City, ZIP, or neighborhood")
  - Price (select: Any Price / Under $500K / $500K–$1M / $1M–$2M / $2M+)
  - Beds (select: Any Beds / 1+ / 2+ / 3+ / 4+)
  - Baths (select: Any Baths / 1+ / 2+ / 3+)
  - Gold "Search" button (`background: var(--gold)`, `color: #0d0d0d`, bold)
- On mobile: fields stack vertically, button full-width

### 3. Property Grid
- Eyebrow + H2: `"Current Listings"` — left-aligned, gold eyebrow, off-white H2
- Section background: `#0d0d0d` (dark — maintains gold and black theme throughout)
- 3-column grid, 6 placeholder cards
- **Card design:**
  - White/off-white card background (`#fff`), subtle shadow
  - Photo top (aspect-ratio 3/2), `object-fit: cover`
  - Gold badge top-left: "Featured" or "New" (matching existing tag style)
  - Body: price in gold Playfair Display, property name, city · status, specs line
  - "Inquire →" link in gold at bottom
  - Hover: `translateY(-4px)` + gold border
- Properties (same 6 as existing `services.html`):
  1. Oceanfront Estate · Palm Beach · $2,495,000
  2. Modern Family Home · Boca Raton · $685,000
  3. Downtown Condo · West Palm Beach · $425,000
  4. Waterfront Villa · Delray Beach · $1,150,000
  5. Duplex Investment · Lake Worth · $385,000
  6. Sky-View Residence · Jupiter · $525,000

### 4. IDX Embed Placeholder
- Background: `#0d0d0d` (dark section)
- Centered `div` with `border: 2px dashed var(--gold-border)`, `border-radius: 10px`, `padding: 80px 40px`
- HTML comment inside: `<!-- SPARK IDX EMBED GOES HERE -->`
- Visible label: `"Live MLS Search — Powered by Spark IDX"` in muted text
- Sub-label: `"Active listings will display here once IDX is connected."` smaller, muted

### 5. CTA Strip
- Dark background (`#0d0d0d`)
- Thin gold horizontal rule above
- Playfair Display headline: `"Ready to Make a Move?"` + `"Contact Betty Today."` (two lines, large)
- Sub: `"Call, text, or email — Betty answers."` — muted
- Two buttons: gold primary `"Call 561-400-2196"` + ghost `"Email Betty"` (off-white border)
- Centered layout

### 6. Footer
Reuse existing footer from `services.html` verbatim. No changes.

---

## JavaScript

Search bar: on "Search" click, read the four field values and `console.log` them (stub). The IDX embed will handle real search once connected. No page reload, no routing needed.

Scroll reveal: use `IntersectionObserver` (already in `js/main.js`) — add `will-reveal` class to property cards and CTA so they animate in. The existing `main.js` already handles this.

Nav scroll behavior: already handled by `main.js` — no changes needed.

Theme toggle: reuse the existing `toggleTheme()` function from `main.js` exactly as every other page does. The theme toggle button in the nav is identical to all other pages. No new JS needed — the page inherits light/dark behavior for free by using the same CSS variables.

---

## Responsive Breakpoints

| Breakpoint | Change |
|---|---|
| `≤ 960px` | Search bar fields wrap to 2-column grid |
| `≤ 640px` | Search bar stacks to 1 column, full-width button |
| `≤ 960px` | Property grid → 2 columns |
| `≤ 620px` | Property grid → 1 column |

---

## What NOT to do

- No gradient blobs in hero background (photo + overlay only)
- No glassmorphism on search card (solid dark background)
- No AI-sounding copy anywhere
- No floating rings, orbs, or decorative SVGs
- No Inter/Roboto — Instrument Sans only for body
- No lorem ipsum

---

## Files Changed

- `services.html` — full rewrite
- No changes to `css/styles.css`, `js/main.js`, or any other page
- Page-specific styles written inline in a `<style>` block within `services.html`
