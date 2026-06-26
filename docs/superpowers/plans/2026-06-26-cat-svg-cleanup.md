# Cat SVG Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the autotraced `public/cat.svg` file, remove all messy overlapping nose/mouth artifacts, reconstruct a clean nose/smile, and minify/optimize the SVG.

**Architecture:** Manually simplify and rebuild the nose and mouth elements using clean bezier curves and shapes, remove redundant artifact layers, and then run `svgo` to optimize the rest of the document.

**Tech Stack:** SVG, SVGO, agent-browser (for visual comparison)

## Global Constraints
- None

---

### Task 1: Rebuild Nose & Mouth Shapes
Rebuild the nose and mouth curves using clean, artifact-free path geometry, and remove the surrounding redundant artifact layers from the SVG.

**Files:**
- Modify: `public/cat.svg`

**Interfaces:**
- Consumes: Existing `public/cat.svg` path data.
- Produces: Symmetrical, clean nose and smile paths.

- [ ] **Step 1: Save a backup copy of the original SVG**
  Run: `cp public/cat.svg public/cat_backup.svg`
  Expected: Backup file created.

- [ ] **Step 2: Edit `public/cat.svg` to remove artifact paths and add the clean nose/mouth**
  Replace paths 18, 32, 41, 48, 55, 64, 72, and 73 with a single clean group representing the nose and smile.
  Specifically, replace these lines in `public/cat.svg`:
  ```xml
  <!-- Replace Path 18 (Nose/Mouth), Path 32, Path 41, Path 48, Path 55, Path 64, Path 72, Path 73 with: -->
  <g id="NoseAndMouth">
    <!-- Nose: Clean rounded cat nose -->
    <path d="M 441 326 C 441 326 448 325 456 325 C 464 325 471 326 471 326 C 473 331 466 348 456 350 C 446 348 439 331 441 326 Z" fill="#221D17" />
    <!-- Mouth: Clean double-arc stroke smile -->
    <path d="M 414 360 C 428 375 448 375 456 350 C 464 375 484 375 498 360" stroke="#221D17" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>
  ```

- [ ] **Step 3: Render the updated SVG in a browser and compare with the backup**
  1. Open the updated SVG in the browser:
     Run: `rtk agent-browser open file:///Users/richardluo/Developer/Qroll/public/cat.svg`
  2. Take a screenshot:
     Run: `rtk agent-browser screenshot /Users/richardluo/.gemini/antigravity-cli/brain/66fa21cd-399a-4030-a0a2-5970c1e47ef7/cat_updated_t1.png`
  3. Visually compare `cat_updated_t1.png` with the original `cat_original.png` using the `view_file` tool to verify the nose/mouth alignment and look. Fine-tune path control points if needed.

- [ ] **Step 4: Commit the initial reconstruction**
  Run:
  ```bash
  rtk git add public/cat.svg
  rtk git commit -m "feat: reconstruct clean nose and mouth in cat.svg, remove artifacts"
  ```

---

### Task 2: Optimize and Minify SVG
Use `svgo` to optimize the rest of the SVG file, stripping out redundant metadata and minifying path data while preserving the visuals.

**Files:**
- Modify: `public/cat.svg`

**Interfaces:**
- Consumes: Updated `public/cat.svg` from Task 1.
- Produces: Minified and clean `public/cat.svg`.

- [ ] **Step 1: Run SVGO on the SVG**
  Run: `rtk npx svgo public/cat.svg -o public/cat.svg`
  Expected: SVGO executes successfully and minifies the file.

- [ ] **Step 2: Visually verify the final minified SVG**
  1. Open the final SVG in the browser:
     Run: `rtk agent-browser open file:///Users/richardluo/Developer/Qroll/public/cat.svg`
  2. Take a final screenshot:
     Run: `rtk agent-browser screenshot /Users/richardluo/.gemini/antigravity-cli/brain/66fa21cd-399a-4030-a0a2-5970c1e47ef7/cat_final.png`
  3. View `cat_final.png` using `view_file` to confirm that the layout, colors, and features remain identical to the original and that no visual regressions occurred.

- [ ] **Step 3: Remove the backup file and commit**
  Run:
  ```bash
  rm public/cat_backup.svg
  rtk git add public/cat.svg
  rtk git commit -m "style: optimize and minify cat.svg using svgo"
  ```
