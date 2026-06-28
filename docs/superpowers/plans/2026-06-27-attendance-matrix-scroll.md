# Attendance Matrix Horizontal Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it visually clear that the attendance matrix is scrollable horizontally when there are many events, using responsive, dynamic gradient overlays and lightweight, non-blocking chevrons.

**Architecture:** We will manage `hasScrollLeft` and `hasScrollRight` states within the `AttendanceMatrix` component, updated via container `onScroll` events and responsive layout `useEffect` listeners. Pure chevron SVGs (no bounding circles) will float on the sticky column boundaries and dynamic gradients will fade outer table edges.

**Tech Stack:** React, Tailwind CSS (v4), Framer Motion, Vitest, Testing Library React.

## Global Constraints
* Naming and Brand styling matching "The Active Canvas": color `#2F2738` (Eggplant Ink), hover transitions, round shapes, Pale Lilac borders (`#ECE6F2`).
* Left chevron absolute position at `left-[130px] sm:left-[170px]` to stay clear of the scrollable attendance status grid cells.
* Left gradient absolute offset at `left-[140px] sm:left-[180px]`.
* Checkbox steps for TDD, implementation, verification, and commits.
* Prefix shell commands with `rtk`.

---

### Task 1: Create Component Test Suite
Define unit tests in Vitest to verify scroll container renders, scroll buttons are present in the DOM, and clicking them fires the appropriate scroll helper function.

**Files:**
* Create: `src/components/AttendanceMatrix.test.tsx`

**Interfaces:**
* Consumes: `src/components/AttendanceMatrix.tsx`
* Produces: Vitest unit tests for scroll mechanics

- [ ] **Step 1: Write the tests**
  Create `src/components/AttendanceMatrix.test.tsx` with the following contents:
  ```tsx
  import React from 'react';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import { AttendanceMatrix } from './AttendanceMatrix';
  import type { AttendanceData } from 'src/lib/attendanceTypes';

  const mockData: AttendanceData = {
    dates: ['2026-06-01', '2026-06-02'],
    attendees: [
      {
        id: 'member-1',
        name: 'Alex Rivera',
        records: [
          { date: '2026-06-01', status: 'present', reason: null },
          { date: '2026-06-02', status: 'absent', reason: null }
        ]
      }
    ]
  };

  describe('AttendanceMatrix Scroll Elements', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders chevrons and scroll container', () => {
      render(<AttendanceMatrix data={mockData} />);
      
      const leftBtn = screen.getByLabelText('Scroll left');
      const rightBtn = screen.getByLabelText('Scroll right');
      
      expect(leftBtn).toBeDefined();
      expect(rightBtn).toBeDefined();
    });

    it('scrolls the container when clicking buttons', () => {
      const scrollBySpy = vi.fn();
      
      render(<AttendanceMatrix data={mockData} />);
      
      const container = document.querySelector('.overflow-x-auto');
      if (container) {
        container.scrollBy = scrollBySpy;
      }

      const leftBtn = screen.getByLabelText('Scroll left');
      const rightBtn = screen.getByLabelText('Scroll right');

      fireEvent.click(leftBtn);
      expect(scrollBySpy).toHaveBeenCalledWith(expect.objectContaining({ left: -200, behavior: 'smooth' }));

      fireEvent.click(rightBtn);
      expect(scrollBySpy).toHaveBeenCalledWith(expect.objectContaining({ left: 200, behavior: 'smooth' }));
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `rtk npm run test src/components/AttendanceMatrix.test.tsx`
  Expected: FAIL (elements not found or labels not present)

- [ ] **Step 3: Commit initial test suite**
  ```bash
  rtk git add src/components/AttendanceMatrix.test.tsx
  rtk git commit -m "test: add horizontal scroll test suite for AttendanceMatrix"
  ```

---

### Task 2: Implement Scroll State & Chevrons
Add scroll states, resize event listeners, smooth scroll handler, dynamic gradients, and minimal chevron icons inside the component rendering.

**Files:**
* Modify: `src/components/AttendanceMatrix.tsx`

**Interfaces:**
* Consumes: none
* Produces: Scrollable component with dynamic overflow hints and controls

- [ ] **Step 1: Add state hooks and handlers in AttendanceMatrix.tsx**
  Add these hooks and handlers at the top of the component (approx line 71-83):
  ```tsx
  const [hasScrollLeft, setHasScrollLeft] = useState(false);
  const [hasScrollRight, setHasScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setHasScrollLeft(scrollLeft > 5);
    setHasScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  const scrollByAmount = (amount: number) => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    // Wait a brief frame for JSDOM/browser to compute widths
    const timer = setTimeout(updateScrollState, 50);
    window.addEventListener("resize", updateScrollState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [dates, attendees]);
  ```

- [ ] **Step 2: Modify the JSX markup in the return statement**
  Replace the existing table wrapper structure (approx lines 480-484) and the bottom absolute gradient (approx lines 577-578) with the following relative layout and dynamic overlays:
  
  *Replace starting block:*
  ```tsx
  return (
    <>
      <div className="relative group/matrix">
        {/* Left Gradient Overlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-[140px] sm:left-[180px] w-10 bg-gradient-to-r from-card to-transparent z-10 transition-opacity duration-300",
            hasScrollLeft ? "opacity-100" : "opacity-0"
          )}
          aria-hidden
        />

        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(-200)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 left-[130px] sm:left-[170px] z-20 p-2 text-primary hover:scale-110 active:scale-95 transition-all duration-200 bg-transparent border-none cursor-pointer flex items-center justify-center",
            hasScrollLeft ? "opacity-45 hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chevron-left"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={updateScrollState}
          className="overflow-x-auto [scrollbar-width:thin]"
        >
          <table className="border-separate border-spacing-y-1">
  ```

  *Replace ending block (remove old mobile-only gradient and add right indicators):*
  ```tsx
          </table>
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(200)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 right-2 z-20 p-2 text-primary hover:scale-110 active:scale-95 transition-all duration-200 bg-transparent border-none cursor-pointer flex items-center justify-center",
            hasScrollRight ? "opacity-45 hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chevron-right"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* Right Gradient Overlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent z-10 transition-opacity duration-300",
            hasScrollRight ? "opacity-100" : "opacity-0"
          )}
          aria-hidden
        />
      </div>

      {renderTooltip()}
      {renderEditor()}
    </>
  );
  ```

- [ ] **Step 3: Run the test suite to verify all tests pass**
  Run: `rtk npm run test src/components/AttendanceMatrix.test.tsx`
  Expected: PASS

- [ ] **Step 4: Run all codebase tests to ensure no regressions**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 5: Commit implementation**
  ```bash
  rtk git add src/components/AttendanceMatrix.tsx
  rtk git commit -m "feat: implement responsive, dynamic horizontal scroll indicators for AttendanceMatrix"
  ```
