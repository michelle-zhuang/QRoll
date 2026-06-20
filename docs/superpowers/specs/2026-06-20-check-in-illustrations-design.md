# Design Spec: Check-in Flow Illustrations Integration

Integration of custom SVG illustrations (`puppy.svg` and `sad_cat.svg`) into the QR check-in flow to enhance the branding and user experience under the "Active Canvas" design system.

## 1. Objectives
- Replace basic and sterile state indicator boxes on the check-in flow page with rich, custom branded states.
- Inject delight into the successful check-in flow using a playful puppy sticker theme.
- Soften the inactive/closed check-in states with a sympathetic sad cat sticker theme.
- Ensure seamless performance and compliance with accessibility/motion preferences.

## 2. Visual Design & Layout

### Success State (Happy Puppy)
- **Container:** Flex column, centered items, custom background tint (`bg-[#D0F4DE]/20`), borders (`border-[#D0F4DE]/40`), rounded-2xl (`20px`), generous padding (`p-6`).
- **Illustration:** `/puppy.svg` centered, size `h-32 md:h-36 w-auto`, unselectable.
- **Micro-interactions:** Interactive "sticker drop" pop effect (`animate-sticker-pop`) that scales from `0.8` to `1.05` and settles back with a minor rotation offset.

### Inactive/Closed State (Sad Cat)
- **Container:** Flex column, centered items, soft Pale Lilac background (`bg-[#F5EFFA]/50`), borders (`border-[#ECE6F2]`), rounded-2xl (`20px`), padding (`p-6`).
- **Illustration:** `/sad_cat.svg` centered, size `h-32 md:h-36 w-auto`, unselectable.
- **Micro-interactions:** A slow, continuous floating drift (`animate-cat-float`) to represent quiet waiting.

## 3. Implementation Details

### Target File
- `src/pages/checkin/[token].astro`

### Custom Keyframe Animation CSS
```css
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

.animate-sticker-pop {
  animation: sticker-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.animate-cat-float {
  animation: cat-float 4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-sticker-pop {
    animation: fadeIn 0.3s ease-out forwards;
  }
  .animate-cat-float {
    animation: none;
  }
}
```

## 4. Accessibility and Performance
- Contrast ratio for body text copy must remain ≥4.5:1 against the tinted backgrounds.
- Respect user preference for reduced motion: animation speeds are halted or reverted to simple crossfades under `prefers-reduced-motion: reduce`.
- SVGs will have explicit `alt=""` and appropriate `aria-hidden="true"` or role declarations where necessary to avoid cluttering screen readers.
