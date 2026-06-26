# Design Spec: Cat SVG Cleanup and Nose/Smile Artifact Fix

This specification details the cleanup of `public/cat.svg` to fix autotracing artifacts around the nose and smile area, remove messy overlapping paths, and optimize the overall file structure while maintaining visual parity.

## 1. Problem Statement
The current `public/cat.svg` is an autotraced file consisting of 77 unoptimized, overlapping vector paths. Specifically:
- **Nose & Smile Artifacts:** There are multiple tiny overlapping dark paths around the nose and mouth region (`translate(441, 325)` to `translate(496, 379)`) which create jagged lines and brown speckles near the smile curve.
- **Messy Structure:** The SVG contains redundant paths, excessive decimal precision, and lacks logical grouping.

## 2. Proposed Design & Changes

### A. Nose and Mouth Recreation
We will replace the messy, autotraced mouth/nose paths with clean, geometrically perfect shapes:
- **Nose:** A clean, symmetrical triangle centered at `(456, 335)`.
  - Top edge from `x = 441` to `x = 471` at `y = 326`.
  - Bottom vertex at `(456, 348)`.
  - Fill color: `#221D17` (matching the dark charcoal of the facial features).
- **Mouth (Smile):** A clean bezier curve ("w" smile) drawn with a stroke.
  - Left curve: Starting at center `(456, 348)`, curving down to `(427, 378)` and ending at `(398, 359)`.
  - Right curve: Starting at center `(456, 348)`, curving down to `(475, 378)` and ending at `(502, 362)`.
  - Stroke color: `#221D17` with `stroke-width="6"`, `stroke-linecap="round"`, and `stroke-linejoin="round"`.
  - Fill: `none`.
- **Remove Artifact Paths:** Delete all duplicate, tiny overlapping dark shapes around the muzzle (`paths 32, 41, 48, 55, 64, 72, 73`).

### B. SVG Optimization
We will run `svgo` on the remaining body, ears, and tabby spot paths to:
- Combine overlapping layers of identical colors where safe.
- Precision-limit coordinates (reducing file size).
- Clean up document metadata and empty groups.

### C. Verification Plan
1. Open the original `cat.svg` and the updated `cat.svg` using `agent-browser`.
2. Take screenshots and compare them side-by-side to verify that:
   - The nose and smile are perfectly clean and artifact-free.
   - The overall shape, colors, and features of the kitty are preserved.

## 3. Checklist
- [x] Identify all messy overlapping paths around the nose/mouth.
- [x] Design geometrically perfect coordinates for the nose and smile.
- [x] Optimize with SVGO.
- [x] Visual validation via `agent-browser` screenshots.
