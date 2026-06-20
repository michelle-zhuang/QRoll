# Login Page Background SVG Integration

## Goal
Integrate the `party.svg` illustration as a full-screen, responsive, and animated background on the `/login` page with a semi-transparent glassmorphic login card overlay.

## Context
The current login page uses a centered card on top of custom blurred gradient orbs. The user wants to replace/augment this layout with the `party.svg` asset (representing a celebratory movement/dance studio vibe) to make the login/sign-up experience more engaging, playful, and visually aligned with the QRoll brand.

## Proposed Approach
1. **Full-screen Background Layer:** Inject the inline SVG or load `party.svg` as a full-bleed absolute/fixed layer behind the main content.
2. **Subtle Motion:** Add soft, CSS-only animations (slow floating, confetti drifting) to background elements to bring the illustration to life.
3. **Glassmorphic Card Overlay:** Style the existing `AstroCard` with background transparency, a backdrop blur, and a custom halo glow shadow to ensure it stands out clearly from the active background.
4. **Contrast & Accessibility Compliance:** Retain solid backgrounds for user inputs and ensure text color/weight satisfies WCAG 2.1 AA requirements.

## Design Details

### 1. Layout & HTML Structure
In [login.astro](file:///Users/richardluo/Developer/QRoll/src/pages/login.astro):
*   Remove the three colored gradient blur `div`s (`animate-blob-1`, `animate-blob-2`, `animate-blob-3`).
*   Add a wrapper `div` with absolute positioning, `inset-0`, `overflow-hidden`, and `z-0` containing the `party.svg` image or inline markup.
*   The SVG element will be styled with `w-full h-full object-cover select-none pointer-events-none opacity-85` to serve as a rich, full-screen backdrop.

### 2. Styling & Glassmorphic Overlay
*   **Main Card:** Style the `AstroCard` wrapper with `bg-white/80 backdrop-blur-md border border-[#ECE6F2]/80 relative z-10`.
*   **Shadow:** Use the design system's Halo Glow shadow: `shadow-[0_8px_30px_rgba(47,39,56,0.06),0_2px_8px_rgba(228,193,249,0.08)]`.
*   **Text & Action Colors:** Retain Eggplant Ink (`#2F2738`) for the main titles, buttons, and form labels.
*   **Input Fields:** Ensure the `EmailAuthForm` inputs have solid backgrounds (e.g., `#FFFDF9` or white) to prevent text clipping/readability issues when overlapping busy parts of the background.

### 3. Background Animations
*   Add custom keyframe animations in CSS to make the balloons float and the confetti sway.
*   Ensure that any floating animation is bypassed if `@media (prefers-reduced-motion: reduce)` is active.
*   Animation specifications:
    *   `float-slow`: A vertical translates of 10-15px with minor rotation over 10-14 seconds.
    *   `sway-slow`: A horizontal drift of 5-8px over 6-8 seconds.

## Error Handling & Validation
*   No changes to existing functional behaviors (OAuth / email validation).
*   Ensure fallback styling is robust if the SVG asset fails to load (falls back gracefully to the solid warm milk background `#FFFDF9`).

## Testing & Verification
*   **Responsiveness:** Verify card size and SVG scaling on mobile (Safari/Chrome emulation) and desktop screens.
*   **A11y Checks:** Verify contrast of headers and inputs using Chrome DevTools Lighthouse or accessibility tool.
*   **Reduced Motion:** Toggle reduced-motion in system settings/devtools and verify animations pause.
