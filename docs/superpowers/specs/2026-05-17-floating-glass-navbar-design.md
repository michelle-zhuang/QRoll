# Design Specification: Floating Glass Navbar

## Overview
A modern, responsive, and highly interactive navigation bar for the QRoll application. It features a "Floating Glass" aesthetic using backdrop-blur and glassmorphism principles, providing a premium feel while maintaining functionality for different user roles (Guest, Attendee, Admin).

## Visual Design
- **Aesthetic:** A centered, floating pill-shaped container.
- **Glassmorphism:** `bg-white/70` (light) or `bg-black/50` (dark) with `backdrop-blur-md` and a thin `border-white/20`.
- **Shape:** `rounded-full` (pill style).
- **Positioning:** `sticky top-6` with a high `z-index` (z-50).
- **Animations (Framer Motion):**
  - **Magic Pill Hover:** A background highlight that slides between navigation items.
  - **Scroll Transition:** Subtle shadow and opacity changes as the user scrolls.
  - **Mobile Drawer:** The pill expands/explodes into a full-screen blurred menu overlay.

## Functional Requirements
- **Role-Based Navigation:**
  - **Guest:** Logo, Home, Login (Google Auth).
  - **Attendee:** Logo, Dashboard (Check-ins), User Profile Dropdown.
  - **Admin:** Logo, Admin Events, New Event, User Profile Dropdown.
- **Responsive Behavior:**
  - **Desktop:** Horizontal pill with all links visible.
  - **Mobile:** Hamburger menu that opens a vertical drawer.
- **Authentication Integration:** Props passed from Astro SSR (`Layout.astro`) containing user session and role data.

## Technical Architecture
- **Framework:** React component (`Navbar.tsx`) using `@astrojs/react` for interactivity.
- **Styling:** Tailwind CSS v4.
- **Icons:** Lucide React.
- **Animation:** Framer Motion.
- **Accessibility:** Radix UI Primitives for the User Dropdown menu.
- **Inclusion:** Integrated globally via `src/layouts/Layout.astro`.

## Implementation Strategy
1. **Infrastructure:** Ensure Radix UI and Framer Motion are configured (already present in `package.json`).
2. **Components:**
   - `src/components/ui/Navbar.tsx`: Main container and logic.
   - `src/components/ui/NavItem.tsx`: Individual links with hover animation.
   - `src/components/ui/UserMenu.tsx`: Authenticated user dropdown.
3. **Global Styling:** Update `global.css` for any necessary backdrop-blur utilities if not natively handled by Tailwind v4.
4. **Layout Integration:** Modify `Layout.astro` to fetch the session and pass it to the `Navbar` component.

## Testing & Validation
- **Responsive Check:** Verify layout on mobile (375px) and desktop (1280px+).
- **Role Verification:** Test UI states for Guest, Attendee, and Admin roles.
- **Interaction Check:** Ensure "magic pill" hover animation and mobile drawer are smooth.
