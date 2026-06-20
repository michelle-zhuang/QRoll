# Check-in Flow Illustrations Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate custom puppy and sad cat SVG illustrations into the check-in success and inactive states to improve user experience under the "Active Canvas" design system.

**Architecture:** We will add CSS keyframes/classes to `src/styles/global.css` using Tailwind v4 theme configurations, and then update `src/pages/checkin/[token].astro` to render the illustrations inside animated themed blocks for the success and inactive check-in outcomes.

**Tech Stack:** Astro, Tailwind CSS v4, React (in components).

## Global Constraints
- Target WCAG 2.1 AA text contrast (minimum 4.5:1).
- Respect user preference for reduced motion (`prefers-reduced-motion`).
- Avoid sharp corners and preserve standard spacing definitions.

---

### Task 1: Add Custom CSS Keyframes and Animation Classes to Theme

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: Tailwind helper classes `animate-sticker-pop` and `animate-cat-float`.

- [ ] **Step 1: Write the animation definitions into `src/styles/global.css`**

Add the `@keyframes` and animation variables inside the `@theme` block.
```css
  --animate-sticker-pop: sticker-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  --animate-cat-float: cat-float 4s ease-in-out infinite;

  @keyframes sticker-pop {
    0% {
      transform: scale(0.8) rotate(0deg);
      opacity: 0;
    }
    70% {
      transform: scale(1.05) rotate(-3deg);
    }
    100% {
      transform: scale(1) rotate(1deg);
      opacity: 1;
    }
  }

  @keyframes cat-float {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-6px) rotate(-1.5deg);
    }
  }
```

- [ ] **Step 2: Commit theme changes**

```bash
git add src/styles/global.css
git commit -m "style: add custom animation theme properties for stickers"
```

---

### Task 2: Integrate Illustrations into Check-in Success and Inactive States

**Files:**
- Modify: `src/pages/checkin/[token].astro`

**Interfaces:**
- Consumes: `/puppy.svg` and `/sad_cat.svg` static files, Tailwind animation classes.

- [ ] **Step 1: Update Success State template**

Modify the `success ?` branch in `src/pages/checkin/[token].astro` to render the Puppy Hero block:
```astro
      ) : success ? (
        <div class="space-y-6">
          <div class="bg-[#D0F4DE]/20 border border-[#D0F4DE]/40 p-6 rounded-2xl flex flex-col items-center gap-4 animate-sticker-pop text-center">
            <img src="/puppy.svg" alt="Success!" class="h-32 md:h-36 w-auto select-none pointer-events-none" aria-hidden="true" />
            <div>
              <p class="text-lg font-bold text-[#2F2738]">You're checked in!</p>
              {existing && <p class="text-sm text-[#6B6377] mt-1">Recorded at {formatPacificTime(existing.checked_in_at)}</p>}
              {message && <p class="mt-3 text-sm text-[#6B6377]">{message}</p>}
            </div>
          </div>
          <a href="/dashboard" class="block">
            <AstroButton variant="outline" className="w-full">
              Return to dashboard
            </AstroButton>
          </a>
        </div>
```

- [ ] **Step 2: Update Inactive State template**

Modify the `!event && nextOccurrence ?` branch in `src/pages/checkin/[token].astro` to render the Sad Cat Hero block:
```astro
      {!event && nextOccurrence ? (
        <div class="space-y-6">
          <div class="bg-[#F5EFFA]/50 border border-[#ECE6F2] p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
            <img src="/sad_cat.svg" alt="No active check-in" class="h-32 md:h-36 w-auto select-none pointer-events-none animate-cat-float" aria-hidden="true" />
            <div>
              <p class="text-lg font-bold text-[#2F2738]">No live check-in right now</p>
              {nextOccurrence.checkin_opens_at ? (
                <p class="text-sm text-[#6B6377] mt-1">
                  Next session opens {formatPacificDateTime(nextOccurrence.checkin_opens_at)}
                </p>
              ) : (
                <p class="text-sm text-[#6B6377] mt-1">No upcoming sessions are scheduled.</p>
              )}
            </div>
          </div>
          <a href="/dashboard" class="block">
            <AstroButton variant="outline" className="w-full">Return to dashboard</AstroButton>
          </a>
        </div>
```

- [ ] **Step 3: Commit check-in flow updates**

```bash
git add src/pages/checkin/\[token\].astro
git commit -m "feat: add puppy and sad cat illustrations to check-in page"
```
