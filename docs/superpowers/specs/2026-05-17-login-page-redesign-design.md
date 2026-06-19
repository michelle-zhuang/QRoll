# Login Page Redesign

## Goal
Redesign the `/login` page to provide a modern, premium, and mobile-first experience using the "Light Login" concept sourced from 21st.dev.

## Context
The current login page uses a basic centered card. The user wants a better design that is highly optimized for mobile devices (as most users will access the app on their phones) while maintaining a clean, professional look on desktop.

## Proposed Approach
We will implement the "Light Login" design concept. This involves a clean, centered card overlaid on a subtle, blurred gradient background. The layout will prioritize mobile responsiveness, ensuring form elements are touch-friendly and the layout uses available screen real estate efficiently.

## Design Details

### Architecture & Components
*   **Mobile-First Layout:** The login card will span nearly the full width of the screen on mobile (e.g., `w-full px-4` or `w-[90vw]`) with a `max-w-md` limit so it doesn't stretch too wide on desktop.
*   **Visuals:**
    *   **Background:** A very clean, light background (using the existing `--background` color).
    *   **Ambient Effect:** A subtle, blurred gradient orb behind the card (e.g., a `div` with absolute positioning, `bg-blue-100` or a theme-appropriate accent color, and `blur-3xl`) to give depth.
    *   **Card:** A white card (`bg-card`) with rounded corners (`rounded-2xl` or similar) and a soft shadow (`shadow-xl`).
*   **Form Elements:** We will utilize the existing `shadcn` components (`Input`, `Label`, `AstroButton`).
*   **Input Optimization:** Inputs will use appropriate `type` attributes (e.g., `type="email"`) to trigger the correct mobile keyboards. Heights of inputs and buttons will be large enough for easy tapping (e.g., `h-12`).

### Page Structure
1.  **Header:** A clean logo or icon at the top, followed by a welcoming title ("Welcome Back" or "QRoll") and a brief subtitle.
2.  **SSO (Primary Action):** The "Continue with Google" button will be placed prominently at the top of the action area, as it's often the preferred mobile login method.
3.  **Divider:** A visual separator with the text "Or continue with email".
4.  **Email Form:**
    *   Email Input
    *   Password Input
    *   Action Buttons: "Sign In" and "Sign Up". Given the mobile-first constraint, we will stack these buttons vertically to ensure they have full-width tap targets, rather than placing them side-by-side.

## Error Handling & Validation
*   HTML5 native validation (`required`, `type="email"`) will be used as the first line of defense.
*   The form will continue to post to the existing Astro API endpoints (`/api/auth/signin`, `/api/auth/email`), meaning server-side logic remains unchanged.

## Testing Strategy
*   Verify the layout on mobile viewport sizes using browser developer tools.
*   Ensure all buttons and inputs are easily tappable.
*   Verify the visual aesthetic (blur, shadows, rounded corners) renders correctly.
*   Confirm that the existing authentication flows (Google, Email sign in/up) still function correctly after the UI update.