# Design Spec: Kitty SVG Illustration Integration

This specification details the replacement of the `/puppy.svg` asset with a custom-designed happy orange tabby kitty illustration, matching the existing "Active Canvas" design system and the Blush.design sticker art style.

## 1. Objectives
- Replace the check-in success sticker (`/puppy.svg`) with a happy/success kitty.
- Maintain visual harmony and art style parity with `/sad_cat.svg` (which is shown for the inactive state).
- Ensure the new asset is a perfect drop-in replacement with zero layout shifting or scaling issues.

## 2. Visual Design & Layout

### Dimensions and viewBox
- **File Name:** `public/puppy.svg` (To avoid changing filenames and updating references in the Astro code, we will write the new kitty SVG content directly into the existing `public/puppy.svg` file path).
- **viewBox:** `300 375 400 262.5` (Identical to the original puppy SVG).
- **Aesthetic:** Flat vector sticker illustration, organic hand-drawn curves, outline-free shapes, solid colors.

### Orange Tabby Color Palette
- **Base Orange (Body, Head, Limbs, Tail):** `#E77E23` (Warm rich orange)
- **Cream (Muzzle, Chest bib, Paws, Tail tip):** `#FFF2E2` (Soft off-white cream)
- **Dark Brown (Stripes, Nose):** `#9E3D01` (Deep warm accent tone)
- **Soft Pink (Inner Ears, Cheeks):** `#FF8F94` (Cute blush color)
- **Off-black (Eyes, Whiskers, Smile):** `#010101` (Charcoal black)

### SVG Shape Composition
- **Head & Ears:** Large oval head with perked-up triangular ears on top. Cream muzzle patch centered on the lower face.
- **Body & Bib:** Teardrop body sitting upright, with a fluffy cream chest bib.
- **Limbs & Paws:** Front paws resting forward with cream tips, back hips curled on the sides.
- **Happy Tail:** An energetic tail curving upward and outward to the right with dark stripes and a cream-colored tip, representing happiness and success.
- **Tabby Stripes:** Three forehead stripes pointing down, and matching stripes on the cheeks and tail.
- **Face Details:** Solid black oval eyes, horizontal blush cheeks, three thin whiskers on each cheek, and a small dark nose with a curved "w" smile.

## 3. Review Checklists

- [x] Check for placeholders or TODOs (None).
- [x] Internal consistency (Dimensions, color theme, and layout constraints match the Astro template's `h-32 md:h-36 w-auto` container perfectly).
- [x] Scope check (Fully contained within modifying `puppy.svg`).
- [x] Ambiguity check (Explicitly using the orange tabby palette selected by the user).
