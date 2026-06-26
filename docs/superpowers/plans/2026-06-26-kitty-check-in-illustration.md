# Kitty Check-in Illustration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current puppy SVG with a custom happy orange tabby kitty SVG illustration on the check-in success screen.

**Architecture:** We will replace the raw XML contents of `/public/puppy.svg` with the newly designed happy kitty illustration. The illustration will use the exact same viewBox, dimensions, and group IDs to fit seamlessly into the existing layout of `src/pages/checkin/[token].astro` without needing code modifications or causing layout shifts.

**Tech Stack:** SVG, Astro, Git.

## Global Constraints
- Target WCAG 2.1 AA text contrast (minimum 4.5:1).
- Respect user preference for reduced motion (`prefers-reduced-motion`).
- Avoid sharp corners and preserve standard spacing definitions.
- Write SVG paths with clean, organic curves and exact coordinates.

---

### Task 1: Replace puppy.svg with Kitty SVG Illustration

**Files:**
- Modify: `public/puppy.svg` (To act as a drop-in replacement)

**Interfaces:**
- Consumed by: `src/pages/checkin/[token].astro` (Renders `/puppy.svg` on success state)

- [ ] **Step 1: Overwrite `/public/puppy.svg` with the happy orange tabby kitty SVG**

Write the following code to `public/puppy.svg`:

```xml
<svg viewBox="300 375 400 262.5" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:blush="http://design.blush" overflow="visible" width="400px" height="262.5px">
  <g id="Master/Stickers/Kitty" blush:has-customizable-colors="true" blush:viewBox="300 375 400 262.5" blush:i="0">
    <g id="Kitty" blush:i="0.0">
      <!-- Tail -->
      <path id="Tail" d="M530 585 C 570 585 620 540 620 480 C 620 420 585 390 615 390 C 635 390 645 420 638 450 C 630 485 635 520 610 555 C 585 590 555 605 530 605 Z" fill="#E77E23" />
      <path id="Tail Tip" d="M615 390 C 625 390 635 393 638 405 C 641 415 638 425 638 430 C 633 425 628 410 615 410 Z" fill="#FFF2E2" />
      <path id="Tail Stripe 1" d="M605 520 C 610 522 615 525 622 525 C 628 525 630 522 632 520 C 630 525 625 528 622 528 C 615 528 610 525 605 520 Z" fill="#9E3D01" />
      <path id="Tail Stripe 2" d="M618 470 C 621 472 625 475 630 475 C 634 475 636 472 638 470 C 636 473 632 477 630 477 C 625 477 621 473 618 470 Z" fill="#9E3D01" />

      <!-- Body -->
      <path id="Body" d="M440 500 C 420 530 410 570 410 600 C 410 615 425 615 450 615 C 475 615 525 615 540 615 C 555 615 560 600 550 570 C 540 530 520 500 480 500 Z" fill="#E77E23" />
      <path id="Chest" d="M460 500 C 450 515 450 540 480 570 C 510 540 510 515 500 500 Z" fill="#FFF2E2" />

      <!-- Left Paw -->
      <path id="Left Paw" d="M440 570 C 440 600 445 615 455 615 C 465 615 465 600 460 570 Z" fill="#E77E23" />
      <path id="Left Paw Tip" d="M442 605 C 442 615 455 615 455 615 C 455 615 458 615 458 605 Z" fill="#FFF2E2" />

      <!-- Right Paw -->
      <path id="Right Paw" d="M500 570 C 495 600 495 615 505 615 C 515 615 520 600 520 570 Z" fill="#E77E23" />
      <path id="Right Paw Tip" d="M502 605 C 502 615 515 615 515 615 C 515 615 518 615 518 605 Z" fill="#FFF2E2" />

      <!-- Left Ear -->
      <path id="Left Ear" d="M425 415 L 410 375 L 450 400 Z" fill="#E77E23" />
      <path id="Left Inner Ear" d="M428 412 L 418 383 L 445 402 Z" fill="#FF8F94" />

      <!-- Right Ear -->
      <path id="Right Ear" d="M535 415 L 550 375 L 510 400 Z" fill="#E77E23" />
      <path id="Right Inner Ear" d="M532 412 L 542 383 L 515 402 Z" fill="#FF8F94" />

      <!-- Head -->
      <path id="Head" d="M415 450 C 415 420 440 395 480 395 C 520 395 545 420 545 450 C 545 480 520 505 480 505 C 440 505 415 480 415 450 Z" fill="#E77E23" />

      <!-- Stripes -->
      <path id="Stripe Forehead Center" d="M477 395 L 483 395 L 480 415 Z" fill="#9E3D01" />
      <path id="Stripe Forehead Left" d="M463 397 L 468 396 L 472 412 Z" fill="#9E3D01" />
      <path id="Stripe Forehead Right" d="M497 397 L 492 396 L 488 412 Z" fill="#9E3D01" />

      <path id="Left Cheek Stripe 1" d="M415 440 L 430 445 L 415 450 Z" fill="#9E3D01" />
      <path id="Left Cheek Stripe 2" d="M415 455 L 428 458 L 415 462 Z" fill="#9E3D01" />
      <path id="Right Cheek Stripe 1" d="M545 440 L 530 445 L 545 450 Z" fill="#9E3D01" />
      <path id="Right Cheek Stripe 2" d="M545 455 L 532 458 L 545 462 Z" fill="#9E3D01" />

      <!-- Muzzle -->
      <path id="Muzzle" d="M460 468 C 460 460 480 460 480 468 C 480 460 500 460 500 468 C 500 478 480 478 480 478 C 480 478 460 478 460 468 Z" fill="#FFF2E2" />

      <!-- Cheek Blush -->
      <ellipse id="Left Cheek Blush" cx="435" cy="468" rx="10" ry="6" fill="#FF8F94" />
      <ellipse id="Right Cheek Blush" cx="525" cy="468" rx="10" ry="6" fill="#FF8F94" />

      <!-- Eyes -->
      <ellipse id="Left Eye" cx="448" cy="445" rx="6" ry="8" fill="#010101" />
      <circle id="Left Eye Catchlight" cx="446" cy="442" r="2" fill="#FFFFFF" />
      <ellipse id="Right Eye" cx="512" cy="445" rx="6" ry="8" fill="#010101" />
      <circle id="Right Eye Catchlight" cx="510" cy="442" r="2" fill="#FFFFFF" />

      <!-- Nose & Mouth -->
      <polygon id="Nose" points="477,464 483,464 480,468" fill="#9E3D01" />
      <path id="Mouth" d="M472 470 C 475 473 480 473 480 470 C 480 473 485 473 488 470" stroke="#010101" stroke-width="2" stroke-linecap="round" fill="none" />

      <!-- Whiskers -->
      <path id="Left Whisker 1" d="M420 465 L 395 460" stroke="#010101" stroke-width="2" stroke-linecap="round" />
      <path id="Left Whisker 2" d="M420 470 L 393 470" stroke="#010101" stroke-width="2" stroke-linecap="round" />
      <path id="Left Whisker 3" d="M420 475 L 395 480" stroke="#010101" stroke-width="2" stroke-linecap="round" />
      <path id="Right Whisker 1" d="M540 465 L 565 460" stroke="#010101" stroke-width="2" stroke-linecap="round" />
      <path id="Right Whisker 2" d="M540 470 L 567 470" stroke="#010101" stroke-width="2" stroke-linecap="round" />
      <path id="Right Whisker 3" d="M540 475 L 565 480" stroke="#010101" stroke-width="2" stroke-linecap="round" />
    </g>
  </g>
</svg>
```

- [ ] **Step 2: Verify code compiling and visual correctness**

Run the dev server to make sure the app loads correctly and there are no XML/SVG parsing issues:
Run command: `rtk npm run build` (or similar build command if applicable)

- [ ] **Step 3: Commit the new kitty asset**

```bash
git add public/puppy.svg
git commit -m "feat: turn puppy illustration into a happy orange tabby kitty"
```
