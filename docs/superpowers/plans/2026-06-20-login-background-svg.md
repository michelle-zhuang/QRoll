# Login Page Background SVG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate `party.svg` as a full-screen, animated background on the login page with a semi-transparent glassmorphic login card.

**Architecture:** 
1. Create a `PartyBackground.astro` component that renders the SVG inline. This allows us to target individual elements (balloons, clouds, confetti) with Tailwind classes and CSS animations.
2. Define custom keyframes and utility classes in `global.css` for floating/swaying animations with prefers-reduced-motion overrides.
3. Replace the current blur blobs in `login.astro` with the new background component, and style the login card overlay using glassmorphic borders and backdrop-blur.

**Tech Stack:** Astro, Tailwind CSS v4, React (EmailAuthForm).

## Global Constraints
- Target WCAG 2.1 AA text contrast (minimum 4.5:1).
- Respect user preference for reduced motion (`prefers-reduced-motion`).
- Do not modify existing functional auth behaviors (Google SSO / Email verification endpoints).

---

### Task 1: Create the PartyBackground Component

**Files:**
- Create: `src/components/PartyBackground.astro`

**Interfaces:**
- Consumes: None
- Produces: `PartyBackground` Astro component

- [ ] **Step 1: Create the file**
  Create the `src/components/PartyBackground.astro` file.
  
- [ ] **Step 2: Add implementation**
  Add the SVG markup inline with animation classes applied to target groups. We'll identify:
  - Balloons: Add class `animate-float-slow-1` to the first balloon, `animate-float-slow-2` to the second balloon.
  - Clouds: Add class `animate-sway-slow` to the clouds.
  - Confetti: Add classes `animate-pulse-slow` to some confetti paths.

  ```astro
  ---
  // src/components/PartyBackground.astro
  ---
  <div class="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-[#FFFDF9]">
    <svg viewBox="80 160 2880.000000000001 2000.0000000000002" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover opacity-85">
      <g id="Master/Background/Party" overflow="visible">
        <!-- Background gradient -->
        <path id="Background" opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M161.004 1418.73C271.9 1134 691.489 1288.92 723.943 1062.61C756.397 836.305 826.154 560.034 1181.37 509.396C1536.58 458.758 1759.13 777.549 2036.56 724.51C2313.99 671.47 2504.38 675.167 2767 909.242C3029.61 1143.32 2962 1919.28 2767 2132.04C2036.56 2132.04 1038.12 2132.04 588.368 2132.04C138.62 2132.04 50.1081 1703.46 161.004 1418.73Z" fill="url(#paint0_linear_login)" />
        
        <!-- Confetti paths -->
        <path id="Confetti 1" class="animate-pulse-slow" fill-rule="evenodd" clip-rule="evenodd" d="M1778.96 518.665C1771.2 497.886 1820.81 492.282 1816.48 508.111C1804.25 503.064 1777.01 515.975 1802.48 521.541C1806.3 523.453 1805.19 529.518 1801.3 530.465C1793.6 531.663 1786.05 525.993 1779.01 531.931C1776.68 540.435 1783.08 546.721 1785.76 553.896C1766.9 558.241 1758.31 522.39 1778.96 518.665" fill="#F85B68" />
        <path id="Confetti 2" fill-rule="evenodd" clip-rule="evenodd" d="M2871.27 593.829C2866.81 589.026 2861.34 593.169 2856.46 590.673C2846.27 584.37 2855.41 576.732 2863.33 574.577C2877.95 565.743 2860.43 555.367 2849.23 560.881C2845.63 561.738 2842.43 557.023 2845.87 554.422C2865.42 539.262 2891.2 554.456 2878.78 579.161C2886.92 588.493 2891.65 597.634 2880.11 606.407C2901.46 627.433 2897.75 640.903 2872.58 655.332C2856.72 661.129 2861.71 642.993 2871.09 638.212C2898.78 621.521 2841.83 611.72 2871.27 593.829" fill="#18B6B8" />
        <path id="Confetti 3" fill-rule="evenodd" clip-rule="evenodd" d="M2400.46 827.72C2396.79 810.128 2393.09 792.991 2394.55 775.147C2406.11 784.962 2440.74 777.632 2435.56 792.052C2430.72 803.514 2420.54 811.657 2415.24 823.009C2412.37 828.533 2407.63 830.376 2400.46 827.72" fill="#18B6B8" />
        <path id="Confetti 4" fill-rule="evenodd" clip-rule="evenodd" d="M2202.58 446.405C2177.01 444.389 2168.29 410.791 2177.66 390.471C2181.8 379.907 2190.66 386.422 2185.96 395.028C2182.39 408.388 2178.98 422.676 2189.42 429.829C2205.9 441.119 2209.37 410.254 2215.67 424.986C2214.05 462.497 2224.08 440.798 2237.8 453.659C2234.2 468.483 2205.41 460.485 2202.58 446.405" fill="#38C270" />
        <path id="Confetti 5" fill-rule="evenodd" clip-rule="evenodd" d="M2721.26 529.029C2693.74 575.57 2691.89 538.813 2680.92 508.983C2695.01 507.848 2707.97 522.906 2721.26 529.029" fill="#FFB201" />
        <path id="Confetti 6" fill-rule="evenodd" clip-rule="evenodd" d="M2600.5 675.306C2588.06 676.666 2575.88 667.06 2562.88 663.953C2596.06 611.738 2577.54 615.364 2600.5 675.306" fill="#FFB201" />
        <path id="Confetti 7" fill-rule="evenodd" clip-rule="evenodd" d="M2378.7 292.147C2374.96 275.78 2394.58 265.846 2403.24 280.184C2413 298.859 2379.41 318.343 2378.7 292.147" fill="#F8CF13" />
        <path id="Confetti 8" fill-rule="evenodd" clip-rule="evenodd" d="M2862.74 179.234C2862.91 191.566 2867.98 203.279 2865.49 216.341C2853.92 214.501 2843.24 205.509 2835 197.42C2850.28 184.42 2854.23 181.805 2862.74 179.234" fill="#F8A613" />
        <path id="Confetti 9" fill-rule="evenodd" clip-rule="evenodd" d="M2327.8 647.022C2302.55 644.916 2315.99 615.61 2335.9 620.656C2351.36 624.784 2341.69 647.681 2327.8 647.022" fill="#F8A613" />
        <path id="Confetti 10" fill-rule="evenodd" clip-rule="evenodd" d="M2910.89 442.04C2910.02 464.011 2876.87 449.473 2884.09 432.605C2890.76 419.283 2912.97 426.613 2910.89 442.04" fill="#F85B68" />
        <path id="Confetti 11" fill-rule="evenodd" clip-rule="evenodd" d="M2739.03 734.349C2733.33 723.62 2712.76 727.156 2710.52 738.759C2709.53 761.771 2747.78 755.141 2739.03 734.349" fill="#F85B68" />
        <path id="Confetti 12" fill-rule="evenodd" clip-rule="evenodd" d="M2847.23 854.418C2845 840.206 2872.49 838.63 2871.43 853.466C2871.27 867.13 2847.28 870.822 2847.23 854.418" fill="#F8CF13" />
        
        <!-- Confetti 13 to 22 (Left side confetti) -->
        <path id="Confetti 13" fill-rule="evenodd" clip-rule="evenodd" d="M811.463 585.721C807.789 568.129 804.095 550.992 805.551 533.148C817.107 542.963 851.743 535.633 846.558 550.053C841.722 561.515 831.536 569.658 826.244 581.01C823.367 586.534 818.626 588.377 811.463 585.721" fill="#18B6B8" />
        <path id="Confetti 14" fill-rule="evenodd" clip-rule="evenodd" d="M1192.26 287.029C1164.74 333.57 1162.89 296.813 1151.92 266.983C1166.01 265.848 1178.97 280.906 1192.26 287.029" fill="#FFB201" />
        <path id="Confetti 15" fill-rule="evenodd" clip-rule="evenodd" d="M1071.5 433.307C1059.06 434.667 1046.88 425.061 1033.88 421.954C1067.06 369.739 1048.54 373.365 1071.5 433.307" fill="#F8CF13" />
        <path id="Confetti 16" fill-rule="evenodd" clip-rule="evenodd" d="M213.468 203.872C209.729 187.505 229.343 177.571 238.004 191.909C247.767 210.584 214.175 230.068 213.468 203.872" fill="#FFB201" />
        <path id="Confetti 17" fill-rule="evenodd" clip-rule="evenodd" d="M798.796 405.023C773.55 402.917 786.991 373.611 806.904 378.657C822.362 382.785 812.692 405.682 798.796 405.023" fill="#FFB201" />
        <path id="Confetti 18" fill-rule="evenodd" clip-rule="evenodd" d="M1381.89 200.04C1381.02 222.011 1347.87 207.473 1355.09 190.605C1361.76 177.283 1383.97 184.613 1381.89 200.04" fill="#F85B68" />
        <path id="Confetti 19" fill-rule="evenodd" clip-rule="evenodd" d="M1210.03 492.35C1204.33 481.621 1183.76 485.157 1181.52 496.76C1180.53 519.772 1218.78 513.142 1210.03 492.35" fill="#F85B68" />
        <path id="Confetti 20" fill-rule="evenodd" clip-rule="evenodd" d="M1318.23 612.419C1316 598.207 1343.49 596.631 1342.43 611.467C1342.27 625.131 1318.28 628.823 1318.23 612.419" fill="#F8CF13" />
        <path id="Confetti 21" fill-rule="evenodd" clip-rule="evenodd" d="M1844.75 275C1844.92 287.332 1849.99 299.045 1847.5 312.107C1835.92 310.267 1825.24 301.275 1817 293.186C1832.28 280.186 1836.23 277.571 1844.75 275" fill="#F8A613" />
        <path id="Confetti 22" fill-rule="evenodd" clip-rule="evenodd" d="M268.577 813.405C243.012 811.389 234.291 777.791 243.664 757.471C247.8 746.907 256.658 753.422 251.965 762.028C248.391 775.388 244.983 789.676 255.424 796.829C271.901 808.119 275.366 777.254 281.669 791.986C280.054 829.497 290.079 807.798 303.802 820.659C300.199 835.483 271.413 827.485 268.577 813.405" fill="#38C270" />

        <!-- Floating objects: Balloon 1 -->
        <g id="Flying Objects 1" opacity="0.5" class="animate-float-slow-1" transform="translate(193 135)">
          <g id="Flying Objects/Balloon Yellow 1">
            <path id="Balloon Yellow Body 1" fill-rule="evenodd" clip-rule="evenodd" d="M445 205.528C428.392 53.6414 264.951 83.8401 255.338 218.971C250.513 275.976 297.854 400.75 367.35 337.596C411.554 308.821 441.627 258.191 445 205.528" fill="#FFB201" />
            <path id="Balloon Yellow String 1" fill-rule="evenodd" clip-rule="evenodd" d="M359.545 377.999C377.302 377.87 378.803 368.334 372.876 364.316C365.255 359.149 341.712 358.45 334 359.311C336.81 368.786 348.045 378.083 359.545 377.999ZM330.098 362C319.325 376.885 302.903 412.505 313.331 419.589C320.946 424.762 337.613 379.754 330.098 362ZM336.75 376.267C333.348 417.426 319.826 427.325 311.851 427.084C302.79 426.811 297.105 406.556 313.756 375.44C318.758 366.763 325.621 357.914 330.454 354C356.099 355.919 391.678 354.72 377.949 375.44C370.874 386.117 346.914 381.355 342.596 377.584C344.077 382.608 344.56 395.109 346.369 416.609C349.217 450.475 341.454 448.438 352.635 482.264C355.265 490.224 354.939 505.765 350.949 512.462C342.662 526.472 361.509 537.894 362.153 552.096C363.393 559.096 360.309 565.011 355.771 569.786C338.475 611.483 371.226 630.172 315.381 674.475C262.946 700.747 333.093 650.84 336.953 637.487C350.835 616.785 336.29 590.982 346.369 570.38C351.13 563.591 356.917 556.8 352.635 548.381C322.245 507.297 350.197 498.691 345.133 478.725C335.912 442.373 342.422 402.304 336.75 376.267Z" fill="#090E2B" />
          </g>
        </g>

        <!-- Floating objects: Balloon 2 -->
        <g id="Flying Objects 2" opacity="0.5" class="animate-float-slow-2" transform="translate(2509 752)">
          <g id="Flying Objects/Balloon Yellow 2">
            <path id="Balloon Yellow Body 2" fill-rule="evenodd" clip-rule="evenodd" d="M445 205.528C428.392 53.6414 264.951 83.8401 255.338 218.971C250.513 275.976 297.854 400.75 367.35 337.596C411.554 308.821 441.627 258.191 445 205.528" fill="#FFB201" />
            <path id="Balloon Yellow String 2" fill-rule="evenodd" clip-rule="evenodd" d="M359.545 377.999C377.302 377.87 378.803 368.334 372.876 364.316C365.255 359.149 341.712 358.45 334 359.311C336.81 368.786 348.045 378.083 359.545 377.999ZM330.098 362C319.325 376.885 302.903 412.505 313.331 419.589C320.946 424.762 337.613 379.754 330.098 362ZM336.75 376.267C333.348 417.426 319.826 427.325 311.851 427.084C302.79 426.811 297.105 406.556 313.756 375.44C318.758 366.763 325.621 357.914 330.454 354C356.099 355.919 391.678 354.72 377.949 375.44C370.874 386.117 346.914 381.355 342.596 377.584C344.077 382.608 344.56 395.109 346.369 416.609C349.217 450.475 341.454 448.438 352.635 482.264C355.265 490.224 354.939 505.765 350.949 512.462C342.662 526.472 361.509 537.894 362.153 552.096C363.393 559.096 360.309 565.011 355.771 569.786C338.475 611.483 371.226 630.172 315.381 674.475C262.946 700.747 333.093 650.84 336.953 637.487C350.835 616.785 336.29 590.982 346.369 570.38C351.13 563.591 356.917 556.8 352.635 548.381C322.245 507.297 350.197 498.691 345.133 478.725C335.912 442.373 342.422 402.304 336.75 376.267Z" fill="#090E2B" />
          </g>
        </g>

        <!-- Floating objects: Cloud -->
        <g id="Flying Objects 3" opacity="0.5" class="animate-sway-slow" transform="translate(1969 5)">
          <g id="Flying Objects/Cloud 1">
            <path id="cloud" fill-rule="evenodd" clip-rule="evenodd" d="M171.044 473.895C161.387 459.137 151.9 436.733 163.002 423.548C169.563 415.755 180.669 416.373 188.629 421.934C196.591 427.495 202.142 436.87 207.441 445.961C198.936 424.955 190.257 403.137 189.653 379.753C189.05 356.369 198.845 330.873 217.134 323.328C236.095 315.504 256.284 328.774 272.648 342.761C307.585 372.621 339.188 408.19 366.334 448.196C364.619 435.639 362.903 422.76 364.903 410.263C366.902 397.765 373.426 385.527 383.427 381.605C393.344 377.714 404.064 382.624 413.373 388.304C445.411 407.843 473.144 437.617 493 473.793C490.055 473.793 494.421 478.67 491.476 478.67L171.044 473.895Z" fill="#F0F1FF" />
          </g>
        </g>
      </g>
      <defs>
        <linearGradient id="paint0_linear_login" x1="117.746" y1="503.923" x2="117.746" y2="2132.04" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E7EAFD" />
          <stop offset="1" stop-color="white" stop-opacity="0.01" />
        </linearGradient>
      </defs>
    </svg>
  </div>
  ```

- [ ] **Step 3: Commit**

```bash
git add src/components/PartyBackground.astro
git commit -m "feat: add PartyBackground component"
```

---

### Task 2: Define Keyframe Animations in global.css

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Tailwind classes in `PartyBackground.astro`
- Produces: CSS animation classes (`animate-float-slow-1`, `animate-float-slow-2`, `animate-sway-slow`, `animate-pulse-slow`)

- [ ] **Step 1: Edit global.css**
  Append custom `@keyframes` definitions and their associated animation classes inside the `@theme` block or custom layers, along with a `@media (prefers-reduced-motion: reduce)` block to reset those properties.

  ```css
  /* Add inside `@theme` in `src/styles/global.css` */
  --animate-float-slow-1: float-slow-1 12s ease-in-out infinite;
  --animate-float-slow-2: float-slow-2 15s ease-in-out infinite;
  --animate-sway-slow: sway-slow 18s ease-in-out infinite;
  --animate-pulse-slow: pulse-slow 4s ease-in-out infinite;

  @keyframes float-slow-1 {
    0%, 100% { transform: translate(193px, 135px) translateY(0px) rotate(0deg); }
    50% { transform: translate(193px, 135px) translateY(-15px) rotate(1deg); }
  }

  @keyframes float-slow-2 {
    0%, 100% { transform: translate(2509px, 752px) translateY(0px) rotate(0deg); }
    50% { transform: translate(2509px, 752px) translateY(-20px) rotate(-1.5deg); }
  }

  @keyframes sway-slow {
    0%, 100% { transform: translate(1969px, 5px) translateX(0px); }
    50% { transform: translate(1969px, 5px) translateX(12px); }
  }

  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  ```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "style: define keyframe animations in global.css"
```

---

### Task 3: Redesign the Login Page Layout and Card

**Files:**
- Modify: `src/pages/login.astro`

**Interfaces:**
- Consumes: `PartyBackground` Astro component
- Produces: Updated login page UI

- [ ] **Step 1: Modify login.astro**
  Edit `src/pages/login.astro` to remove the background blob divs, import and add `<PartyBackground />`, and update the `AstroCard` classes to be semi-transparent and use the custom halo shadow.

  ```astro
  ---
  // src/pages/login.astro changes
  import Layout from '../layouts/Layout.astro';
  import AstroButton from '../components/AstroButton.astro';
  import AstroCard from '../components/AstroCard.astro';
  import { EmailAuthForm } from '../components/EmailAuthForm';
  import { FcGoogle } from 'react-icons/fc';
  import PartyBackground from '../components/PartyBackground.astro';

  const next = Astro.url.searchParams.get('next') || '/dashboard';
  const signinUrl = `/api/auth/signin?next=${encodeURIComponent(next)}`;
  const emailUrl = `/api/auth/email?next=${encodeURIComponent(next)}`;
  ---
  <Layout title="Login">
    <main class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 relative overflow-hidden">
      <!-- Full screen background SVG -->
      <PartyBackground />

      <!-- Glassmorphic Login Card -->
      <AstroCard className="w-full max-w-md relative z-10 p-8 bg-white/80 backdrop-blur-md border border-[#ECE6F2]/80 shadow-[0_8px_30px_rgba(47,39,56,0.06),0_2px_8px_rgba(228,193,249,0.08)]">
        <div class="flex flex-col items-center mb-8">
          <div class="h-16 w-16 rounded-2xl bg-card border flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-foreground" aria-hidden="true">
              <rect width="5" height="5" x="3" y="3" rx="1"/>
              <rect width="5" height="5" x="16" y="3" rx="1"/>
              <rect width="5" height="5" x="3" y="16" rx="1"/>
              <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
              <path d="M21 21v.01"/>
              <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
              <path d="M3 12h.01"/>
              <path d="M12 3h.01"/>
              <path d="M12 16v.01"/>
              <path d="M16 12h1"/>
              <path d="M21 12v.01"/>
              <path d="M12 21v-1"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-center text-balance">Welcome back</h1>
          <p class="text-muted-foreground text-center mt-2 text-sm">Sign in or create an account to continue</p>
        </div>

        <form action={signinUrl} method="post" class="mb-6">
          <AstroButton type="submit" variant="outline" className="w-full h-11">
            <FcGoogle className="!w-5 !h-5" />
            Continue with Google
          </AstroButton>
        </form>

        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t"></span>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-3 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <EmailAuthForm endpoint={emailUrl} client:load />
      </AstroCard>
    </main>
  </Layout>
  ```

- [ ] **Step 2: Commit**

```bash
git add src/pages/login.astro
git commit -m "feat: integrate PartyBackground and redesign login card"
```

---

### Task 4: Verification and Quality Check

**Files:**
- None (Build and run checks)

- [ ] **Step 1: Build the project**
  Run: `npm run build`
  Expected: Successful production build with no type or bundler errors.

- [ ] **Step 2: Run test suite**
  Run: `npm run test`
  Expected: All tests pass.

- [ ] **Step 3: Detect changes using GitNexus**
  Run: `npx gitnexus detect-changes`
  Expected: Verification that modified symbols match our plan scope.
