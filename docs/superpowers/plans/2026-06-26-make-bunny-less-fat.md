# Make Bunny Less Fat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the bunny SVG asset to make it 15% narrower (slimmer) horizontally relative to its center, and visually verify the result.

**Architecture:** Use a horizontal scale SVG transformation group wrapper around the SVG paths. Preserve the canvas dimensions and centering.

**Tech Stack:** SVG, HTML, agent-browser, git.

## Global Constraints
- Horizontal scale factor: 0.85 (15% slimmer).
- Canvas dimensions: 1024x1024 (center at X = 512).
- Clean up temporary test files before finishing.

---

### Task 1: Back up the original SVG and apply the scaling transformation

**Files:**
- Create: `public/bunny-original.svg` (backup of original)
- Modify: `public/bunny.svg`

**Interfaces:**
- Produces: Updated `public/bunny.svg` containing the slimmed illustration.

- [ ] **Step 1: Copy the original SVG as a backup for comparison**
  Run: `cp public/bunny.svg public/bunny-original.svg`

- [ ] **Step 2: Modify `public/bunny.svg` to wrap paths in the transformation group**
  Modify: `public/bunny.svg`
  
  Target Content (Lines 3-28, surrounding all `<path>` tags):
  Insert `<g transform="translate(512, 0) scale(0.85, 1) translate(-512, 0)">` after the opening `<svg>` tag (line 2), and close it with `</g>` before the closing `</svg>` tag (line 29).

- [ ] **Step 3: Commit the initial changes**
  Run:
  ```bash
  rtk git add public/bunny.svg public/bunny-original.svg
  rtk git commit -m "feat: apply 15% horizontal scale transform to bunny.svg"
  ```

---

### Task 2: Create a comparison page and verify visually

**Files:**
- Create: `public/bunny-test.html`
- Create: `/Users/richardluo/.gemini/antigravity-cli/brain/5abbd4aa-2262-486b-b19e-273727c40d4b/scratch/bunny-comparison.png`

- [ ] **Step 1: Create `public/bunny-test.html` comparison page**
  Create file `public/bunny-test.html` with content:
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Bunny Scale Comparison</title>
    <style>
      body {
        background-color: #2b2b2a;
        color: #fff;
        font-family: sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0;
        padding: 20px;
      }
      .container {
        display: flex;
        gap: 40px;
        margin-top: 20px;
      }
      .col {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      img {
        width: 400px;
        height: 400px;
        border: 2px dashed #555;
        background-color: #1e1e1e;
      }
      h2 {
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <h1>Bunny Width Comparison (Original vs. 85% Scale)</h1>
    <div class="container">
      <div class="col">
        <h2>Original (Fat)</h2>
        <img src="bunny-original.svg" alt="Original Bunny">
      </div>
      <div class="col">
        <h2>Slimmed (15% Less Fat)</h2>
        <img src="bunny.svg" alt="Slimmed Bunny">
      </div>
    </div>
  </body>
  </html>
  ```

- [ ] **Step 2: Capture a comparison screenshot using agent-browser**
  Run:
  ```bash
  rtk agent-browser open "file:///Users/richardluo/Developer/Qroll/public/bunny-test.html" && rtk agent-browser screenshot /Users/richardluo/.gemini/antigravity-cli/brain/5abbd4aa-2262-486b-b19e-273727c40d4b/scratch/bunny-comparison.png
  ```

- [ ] **Step 3: View the screenshot to verify**
  Verify the image `/Users/richardluo/.gemini/antigravity-cli/brain/5abbd4aa-2262-486b-b19e-273727c40d4b/scratch/bunny-comparison.png` looks correct.

---

### Task 3: Clean up temporary comparison files

**Files:**
- Modify: `public/bunny.svg` (commit tracking)
- Delete: `public/bunny-original.svg`
- Delete: `public/bunny-test.html`

- [ ] **Step 1: Delete original backup and comparison HTML**
  Run: `rm public/bunny-original.svg public/bunny-test.html`

- [ ] **Step 2: Commit final cleanup**
  Run:
  ```bash
  rtk git add public/bunny.svg
  rtk git rm public/bunny-original.svg public/bunny-test.html
  rtk git commit -m "clean: remove temporary comparison files and finalize bunny.svg"
  ```
