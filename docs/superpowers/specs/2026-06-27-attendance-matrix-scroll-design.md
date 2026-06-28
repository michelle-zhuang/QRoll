# Spec: Attendance Matrix Horizontal Scroll Optimization

## 1. Problem Statement
When the attendance matrix contains a large number of events (dates), the table expands horizontally and overflows its container. 
* Desktop users using a scroll-wheel mouse do not have an obvious scroll indicator and must hold `Shift` to scroll horizontally, or locate the thin, often-hidden scrollbar.
* On some platforms/devices, the scrollbar is hidden by default.
* There is no visual guidance indicating that more events exist off-screen.

## 2. Proposed Solution
To make horizontal scrollability clear and highly usable on all screens (desktop, tablet, mobile), we will implement a combination of:
1. **Dynamic Gradient Fade Overlays**: Left and right linear gradients that fade visual columns to indicate off-screen content.
2. **Compact Chevrons**: Small, borderless, semi-transparent navigation chevrons (`ChevronLeft`, `ChevronRight`) placed strategically to avoid blocking the data cells.

## 3. Detailed Component Spec

### 3.1 Styling & Theme Alignment
* The component follows "The Active Canvas" design tokens:
  * Foreground icon color: `#2F2738` (Eggplant Ink, standard text-foreground)
  * Default opacity: `45%` (`opacity-45`) to remain extremely unobtrusive.
  * Hover opacity: `100%` (`opacity-100`) for clear interactivity.
  * Active state: Scale down slightly (`active:scale-95`) with standard `150ms` transitions.
* **Chevron Size**: `20px` width/height.

### 3.2 Non-Blocking Layout & Position
* The scrollable table is wrapped in a relative container (`relative`).
* **Left Chevron**:
  * Positioned absolutely at `left-[130px] sm:left-[170px]` (overlaying the dynamic border of the sticky name column) to overlay the right border of the sticky name column rather than blocking the active data cells.
* **Right Chevron**:
  * Positioned absolutely at `right-2`.
* **Gradients**:
  * Left gradient overlay starts at the sticky column border (`left-[140px] sm:left-[180px]`) and fades out over `40px` width.
  * Right gradient overlay sits on the rightmost edge and fades leftward over `40px` width.

### 3.3 Scroll Detection & State Management
* Introduce two state variables in `AttendanceMatrix.tsx`:
  * `hasScrollLeft` (boolean)
  * `hasScrollRight` (boolean)
* A `useRef` handles reference to the scroll container `div`.
* An `onScroll` event listener or inline handler updates the state variables:
  ```typescript
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setHasScrollLeft(el.scrollLeft > 5);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setHasScrollRight(el.scrollLeft < maxScroll - 5);
  };
  ```
* Use standard React `useEffect` to trigger this calculation on component mount and window resize.
* The chevrons and gradients are conditionally rendered or transitioned (`opacity-0 pointer-events-none` vs visible states) based on `hasScrollLeft` and `hasScrollRight`.

## 4. Blast Radius (Impact Analysis)
* Target symbol: `AttendanceMatrix` (`src/components/AttendanceMatrix.tsx`).
* Upstream consumers:
  * `src/pages/dashboard.astro`
* Risk level: **LOW**. Changes are localized to the internal rendering and CSS layout of the matrix container.
