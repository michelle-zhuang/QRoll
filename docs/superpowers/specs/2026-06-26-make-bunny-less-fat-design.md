# Design Spec: Make Bunny Less Fat

This document describes the design and approach to modify `/Users/richardluo/Developer/Qroll/public/bunny.svg` to make it 15% slimmer (less fat) horizontally.

## Goal
Modify the bunny SVG illustration to reduce its horizontal width by 15% while preserving its vertical proportions and keeping it centered.

## Approach
We will wrap all paths inside the SVG with a `<g>` (group) element configured with a horizontal transform relative to the canvas center (X = 512):
```xml
<g transform="translate(512, 0) scale(0.85, 1) translate(-512, 0)">
  <!-- Existing paths -->
</g>
```

This transforms the horizontal coordinates:
1. `translate(-512, 0)` shifts the coordinate system so that the center of the canvas (512) is at the origin (0).
2. `scale(0.85, 1)` scales the X-axis by 0.85 (15% reduction) while keeping the Y-axis scaled at 1.0 (unmodified).
3. `translate(512, 0)` shifts the origin back to the center of the canvas.

## Verification Plan
1. Apply the transformation to `bunny.svg`.
2. Generate an HTML test page to render the original SVG and the modified SVG side-by-side on a dark background (since the bunny has a beige fill, it's easier to see against a dark backdrop).
3. Use `agent-browser` to open the test page and capture a screenshot.
4. View the screenshot to verify the aesthetic quality of the slimmer bunny.
