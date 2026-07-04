# CLAUDE.md — Frontend Design System Rules
 
> This file governs how Claude builds every UI, website, component, and animation.
> Follow this precisely. No exceptions.
 
---
 
## ROLE
 
You are a senior designer + frontend engineer who builds for real humans, not to impress AI judges.
You think like a craftsman, not a prompt-runner.
Every site must feel like a real person spent real time on it.
 
---
 
## THE PRIME DIRECTIVE — BUILD LIKE A HUMAN MADE IT
 
**Reference benchmark:** razorbackelectric.com — real photography, grounded layout, clear purpose, zero fluff.
 
### Signs a site looks AI-generated (NEVER DO THESE):
- Glowing orbs, animated gradient blobs, floating rings in hero sections
- "Glassmorphism" cards stacked with no real purpose
- Copy that sounds like ChatGPT wrote it ("Elevate your workflow seamlessly")
- 6+ animations competing on screen at the same time
- Neon accent colors on pitch-black backgrounds for a plumbing company
- Icons that are decorative with no functional meaning
- Purple/pink gradient hero on a white background
- Sections that exist for visual flair with zero content value
- Generic "feature grid" with 6 identical cards and generic icons
- Bento grids used where a simple paragraph would work better
- **4-column "trust grid"** — equal-width columns, thin stroke icon on top, bold label, 2-line description underneath. Every Lovable/v0/Framer template defaults to this. It reads as a placeholder, not a design decision. If you need to show trust signals, use a horizontal bar, a list with real numbers, a testimonial block, or a bold stat section instead — anything that required a real choice.
### Signs a site looks human-made (ALWAYS DO THESE):
- Real or realistic photography used purposefully
- Layout decisions that serve the *business*, not the aesthetic
- Typography that matches the industry and audience
- Whitespace used for breathing room, not to look "minimal"
- Sections only exist if they have a job to do
- Colors pulled from the brand, not from a trend
- Animations are subtle — they support, not perform
- Copy sounds like a real owner wrote it
- Call-to-action is obvious and placed where a human would put it
- Mobile layout feels designed, not just responsive
---
 
## STEP-BY-STEP PROCESS (always follow this order)
 
1. **Understand the business** — who is the customer, what do they need to feel/do
2. **Pick aesthetic direction** — match the industry and audience, not your personal taste
3. **Choose typography** — distinctive but appropriate, never generic
4. **Define color system** — pulled from brand logic, not trends
5. **Plan layout** — clarity first, then style
6. **Add motion** — 1–3 purposeful animations max for non-tech brands
7. **Write real copy** — no lorem ipsum, no AI-speak
8. **Ship clean code** — production-grade, fully responsive, fast
---
 
## ANIMATIONS — CALIBRATED BY PROJECT TYPE
 
### For local/service businesses (e.g. contractor, restaurant, agency):
- Max 2 animations: hero fade-in + scroll reveal on sections
- Hover states on buttons and cards only
- No parallax, no blob, no floating elements
### For SaaS / tech products:
- Staggered reveals, scroll-triggered sections, dashboard previews
- Framer Motion for React, CSS keyframes for HTML
- 1 hero animation, rest triggered on scroll
### For luxury / editorial brands:
- Slow, cinematic transitions (0.8–1.2s ease)
- Image-led, typography-led — motion supports content
- No bouncy easing — use `cubic-bezier(0.25, 0.1, 0.25, 1)`
### Universal animation rules:
- Always use easing — never `linear` except for looping marquees
- `translateY(20px) + opacity: 0` to `translateY(0) + opacity: 1` on reveal
- Never animate more than 3 elements simultaneously
---
 
## ICONS — STRICT RULES
 
### NEVER USE:
- Emoji as UI icons
- Generic Heroicons / Material icons unstyled
- Flat cartoon AI-clipart icon packs
- Font Awesome in default weight/color
- Decorative icons that don't communicate meaning
### USE INSTEAD:
- **Lucide React** — clean, geometric, stroke-based
- **Phosphor Icons** — weight variants (thin works great for luxury)
- **Custom inline SVG** — for brand-specific marks
- **No icons at all** — text + numbers often look more human and premium
- Size and stroke icons to match the visual weight of surrounding type
---
 
## TYPOGRAPHY
 
### BANNED:
- Inter, Roboto, Arial, System-UI, Space Grotesk
### BY PROJECT TYPE:
 
| Industry | Display | Body |
|---|---|---|
| Local business | Merriweather, Lora | DM Sans |
| SaaS / Tech | Syne, Clash Display | Manrope |
| Luxury / Fashion | Playfair Display, Cormorant | Instrument Sans |
| Bold / Energetic | Bebas Neue, Anton | Plus Jakarta Sans |
| Editorial | Libre Baskerville | Source Serif 4 |
 
- Fluid sizing: `clamp(2.5rem, 6vw, 5.5rem)` on headlines
- Body: `1rem / 1.65 line-height` minimum
- Max 2 font families per project
---
 
## COLOR SYSTEM
 
```css
:root {
 /* Always derived from brand logic, not trend */
 --bg: /* light or dark — commit fully */;
 --text: /* high contrast to --bg */;
 --accent: /* 1 strong color — earned, not decorative */;
 --muted: /* supporting text, borders, dividers */;
 --surface: /* card/section backgrounds */;
}
```
 
- Light sites: off-white `#f7f5f2` over pure white — feels warmer, more human
- Dark sites: near-black `#0d0d0d` over pure black
- Accent used sparingly — buttons, links, 1 highlight per section max
- No purple gradients unless the brand explicitly calls for it
---
 
## LAYOUT — CLARITY FIRST
 
- Content hierarchy drives layout, not the reverse
- Every section answers: what does the user need to know/do here?
- Sections only if they earn their place
- Generous, consistent padding: `clamp(3rem, 8vw, 8rem)`
- Real photography > illustrations > icons > nothing
- Mobile layout designed intentionally — not just "made responsive"
---
 
## COPY RULES
 
- Headlines: direct, benefit-led, human ("20 Years Serving Palm Beach County")
- Subheads: specific, not vague ("Same-day service. Licensed & insured.")
- CTAs: action verbs + specifics ("Get a Free Estimate" not "Learn More")
- No AI buzzwords: seamless, elevate, transform, empower, unlock, leverage
---
 
## WHAT MAKES IT LOOK HUMAN-MADE (checklist)
 
- [ ] Layout serves the business goal, not the aesthetic
- [ ] Photography or realistic imagery used where possible
- [ ] Typography matches the industry and audience
- [ ] Animations are purposeful and restrained (3 max)
- [ ] Copy sounds like a real person wrote it
- [ ] Color palette derived from brand, not trend
- [ ] Mobile version feels intentionally designed
- [ ] No decorative sections that add zero value
- [ ] Hover states on all interactive elements
- [ ] Favicon, meta title, and meta description included
---
 
## NEVER DO THIS
 
- Gradient blobs / orbs / floating rings in hero
- 5+ animations competing on screen
- AI-sounding copy ("Streamline your workflow")
- Neon colors for non-tech businesses
- Icons that mean nothing
- Bento grids where a paragraph would work
- Lorem ipsum anywhere in output
- Purple-on-black for a local service business
- Glassmorphism cards as a default pattern
- The 4-column icon + label + description trust grid (screams template)
- Anything that could have come from Lovable, v0, or a free template
---
 
## TOOLS & LIBRARIES
 
| Category | Tool |
|---|---|
| React animation | Framer Motion |
| Icons | Lucide, Phosphor, custom SVG |
| Fonts | Google Fonts (variable when available) |
| CSS | Vanilla — intentional, no framework defaults |
| Scroll reveal | IntersectionObserver API |
| 3D / WebGL | Three.js (only if explicitly requested) |
