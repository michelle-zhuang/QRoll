---
name: QRoll
description: Verified attendance tracking for recurring group events
colors:
  primary: "#2F2738"
  primary-foreground: "#FFFDF9"
  secondary: "#D0F4DE"
  secondary-foreground: "#2F2738"
  muted: "#F5EFFA"
  muted-foreground: "#6B6377"
  accent: "#E4C1F9"
  accent-foreground: "#2F2738"
  background: "#FFFDF9"
  card: "#FFFFFF"
  border: "#ECE6F2"
  ring: "#A9DEF9"
typography:
  display:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.2
  headline:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "oklch(0.25 0.03 290)"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: QRoll

## 1. Overview

**Creative North Star: "The Active Canvas"**

"The Active Canvas" represents vibrant, functional pastel blocks placed upon a warm milk canvas. The design expresses the structure, rhythm, and active motion of event organizing (specifically matching a dance studio/active movement vibe) while maintaining clean layout boundaries. 

This system rejects dry, sterile grid interfaces and over-designed SaaS landing clichés, replacing them with friendly typography, tactile pill-like controls, and soft layered depth.

### Key Characteristics:
- **Playful Contrast:** Bold dark ink paired with pastel mint and lavender accent blocks.
- **Pill-like Shapes:** Generous corner rounding (12px) making the UI feel friendly and touch-friendly.
- **Rhythmic Density:** Well-spaced tables and controls designed to be readable on the move.

---

## 2. Colors

The "Playful Dream" color scheme balances structural ink with energetic pastel highlights.

### Primary
- **Eggplant Ink** (`#2F2738`): The main text, primary buttons, and layout structural borders. Used for ultimate legibility.

### Secondary
- **Fresh Mint** (`#D0F4DE`): Indicates positive states, success, or active sessions. Provides an organic, fresh accent.

### Accent
- **Soft Lavender** (`#E4C1F9`): Secondary actions, category markers, and focus states. Adds a playful, modern studio vibe.

### Neutral
- **Warm Milk** (`#FFFDF9`): Page background color. Soft on the eyes under any light conditions.
- **Pale Lilac** (`#F5EFFA`): Background for muted elements, empty states, and inactive inputs.
- **Muted Grape** (`#6B6377`): Secondary description text, captions, and sub-labels.

### Named Rules
**The Accent Rarity Rule.** Primary Eggplant Ink and Warm Milk carry 90% of the screen weight. Fresh Mint and Soft Lavender must occupy ≤10% of any view, serving purely to draw focus to action points and badges.

---

## 3. Typography

**Display Font:** System Sans (`system-ui, -apple-system, sans-serif`)
**Body Font:** System Sans (`system-ui, -apple-system, sans-serif`)
**Label/Mono Font:** System Monospace (`monospace`)

### Hierarchy
- **Display** (Bold (600), `clamp(2rem, 5vw, 3rem)`, `1.2`): Page titles and scanning check-in confirmation headers.
- **Headline** (Semi-bold (600), `1.5rem` (24px), `1.3`): Card headers and primary section titles.
- **Title** (Medium (500), `1.125rem` (18px), `1.4`): Roster names and modal titles.
- **Body** (Regular (400), `0.875rem` (14px), `1.5`): General instructions, details, notes, and metrics. Cap prose line length at 70ch.
- **Label** (Medium (500), `0.75rem` (12px), `0.05em` tracking): Badges, table column headers, and technical logs.

---

## 4. Elevation

The system uses a soft, layered depth model. Depth is established using structural borders combined with permanent, extremely soft shadows to create a layered effect.

### Shadow Vocabulary
- **Halo Glow** (`0 8px 30px rgba(47,39,56,0.06), 0 2px 8px rgba(228,193,249,0.08)`): Used on primary cards, forms, and dialog boxes to separate them from the Warm Milk background.

### Named Rules
**The Structural Shadow Rule.** Shadows must never be stark black or grey. They are tinted toward the eggplant/lavender background scale, ensuring a cohesive and clean glow.

---

## 5. Components

### Buttons
- **Shape:** Generous rounded pill (12px radius).
- **Primary:** Eggplant Ink background (`#2F2738`) with Warm Milk text (`#FFFDF9`), padding `12px 24px`.
- **Hover/Focus:** Transitions to a deeper shade on hover, with a Soft Sky Blue ring (`#A9DEF9`) on focus.

### Cards / Containers
- **Corner Style:** Rounded (12px radius).
- **Background:** Solid Card White (`#FFFFFF`).
- **Shadow Strategy:** Halo Glow shadow applied with a subtle Pale Lilac border (`#ECE6F2`).
- **Internal Padding:** Spacing Large (`24px`).

### Inputs / Fields
- **Style:** Pale Lilac background (`#F5EFFA`) with a subtle border (`#ECE6F2`) and 10px radius.
- **Focus:** Border transitions to Eggplant Ink with a Soft Sky Blue ring (`#A9DEF9`) shadow.

---

## 6. Do's and Don'ts

### Do:
- **Do** use Fresh Mint (`#D0F4DE`) exclusively for positive states (checked in, live session) and Soft Lavender (`#E4C1F9`) for neutral categories.
- **Do** ensure body text maintains a contrast ratio of ≥4.5:1 against its background.
- **Do** apply generous padding (24px) to cards to preserve "The Active Canvas" airy aesthetic.

### Don't:
- **Don't** use sterile, thin spreadsheet borders (e.g. `border-gray-200`); always use the brand's Pale Lilac border (`#ECE6F2`).
- **Don't** use sharp corners; every interactive component must have at least an 8px radius.
- **Don't** apply gradients to text headers; use solid Eggplant Ink (`#2F2738`) for display text.
- **Don't** animate image dimensions on hover. Animate background scaling or card shadows instead.
