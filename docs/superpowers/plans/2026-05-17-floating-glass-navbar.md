# Floating Glass Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a responsive, floating glassmorphism navbar using React, Framer Motion, and Tailwind v4, integrated into the Astro global layout.

**Architecture:** A main `Navbar.tsx` component orchestrates the navigation. It receives user session/role data from Astro (SSR) and renders different links for Guests, Attendees, and Admins. It uses Framer Motion for a "magic pill" hover effect and a smooth mobile drawer.

**Tech Stack:** React, Framer Motion, Lucide React, Tailwind CSS v4, Astro (SSR).

---

### Task 1: Create Navigation Item Component

**Files:**
- Create: `src/components/ui/NavItem.tsx`

- [ ] **Step 1: Write the NavItem component with Framer Motion hover logic**

```tsx
import { motion } from "framer-motion";

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
}

export const NavItem = ({ href, label, isActive }: NavItemProps) => {
  return (
    <a
      href={href}
      className="relative px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="navbar-hover"
          className="absolute inset-0 bg-slate-100 rounded-full -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </a>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/NavItem.tsx
git commit -m "feat: add NavItem component with hover animation"
```

---

### Task 2: Create User Menu Component

**Files:**
- Create: `src/components/ui/UserMenu.tsx`

- [ ] **Step 1: Write a simple UserMenu dropdown (Guest vs Auth)**

```tsx
import { User, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UserMenuProps {
  user: any;
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <a
        href="/login"
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all"
      >
        <LogIn className="w-4 h-4" />
        <span>Login</span>
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 border-2 border-white shadow-sm overflow-hidden"
      >
        {user.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
          >
            <div className="px-3 py-2 border-b border-slate-50 mb-1">
              <p className="text-xs font-semibold text-slate-900">{user.email}</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/UserMenu.tsx
git commit -m "feat: add UserMenu component with dropdown and auth states"
```

---

### Task 3: Create Main Navbar Component

**Files:**
- Create: `src/components/ui/Navbar.tsx`

- [ ] **Step 1: Write the Navbar component with role logic and mobile drawer**

```tsx
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavItem } from "./NavItem";
import { UserMenu } from "./UserMenu";

interface NavbarProps {
  user: any;
  role: "admin" | "attendee" | "guest";
  currentPath: string;
}

export const Navbar = ({ user, role, currentPath }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/dashboard", label: "Dashboard", show: role !== "guest" },
    { href: "/admin", label: "Events", show: role === "admin" },
  ].filter(link => link.show);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
      <nav className={`
        relative px-6 py-3 flex items-center justify-between rounded-full transition-all duration-300
        ${isScrolled ? "bg-white/80 backdrop-blur-lg shadow-lg border-white/40" : "bg-white/40 backdrop-blur-sm border-white/20"}
        border
      `}>
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">QR</div>
          <span className="font-extrabold text-slate-900 tracking-tight hidden sm:block">QRoll</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <NavItem 
              key={link.href} 
              href={link.href} 
              label={link.label} 
              isActive={currentPath.startsWith(link.href)} 
            />
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <UserMenu user={user} />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-2xl md:hidden"
            >
              <div className="flex flex-col gap-4">
                {links.map(link => (
                  <a 
                    key={link.href}
                    href={link.href}
                    className="text-lg font-semibold text-slate-900 px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Navbar.tsx
git commit -m "feat: add main Navbar component with glassmorphism and mobile logic"
```

---

### Task 4: Integrate Navbar into Global Layout

**Files:**
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Update Layout.astro to fetch session and inject Navbar**

```astro
---
import "../styles/global.css";
import { Navbar } from "../components/ui/Navbar";
import { createSupabaseClient } from "../lib/supabase";

interface Props {
	title?: string;
}

const { title = 'QRoll' } = Astro.props;
const currentPath = Astro.url.pathname;

// Fetch user session and profile for role logic
const supabase = createSupabaseClient(Astro.request);
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user;

let role = "guest";
if (user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  role = profile?.role || "attendee";
}
---
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<link rel="icon" href="/favicon.ico" />
		<meta name="generator" content={Astro.generator} />
		<title>{title}</title>
	</head>
	<body class="bg-slate-50 antialiased">
		<Navbar client:load user={user} role={role as any} currentPath={currentPath} />
		<main class="pt-24">
			<slot />
		</main>
	</body>
</html>

<style is:global>
	html,
	body {
		margin: 0;
		width: 100%;
		height: 100%;
	}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: integrate Navbar into global Layout with SSR auth context"
```

---

### Task 5: Verify Implementation

- [ ] **Step 1: Check mobile responsiveness**
Resize browser to mobile width and verify the hamburger menu works and the drawer opens with blur.

- [ ] **Step 2: Check role-based links**
Login as an admin (if possible) or mock the role prop to ensure "Events" only shows for admins.

- [ ] **Step 3: Check glassmorphism**
Scroll down a page and ensure the navbar background blurs the content underneath correctly.
