import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, LogIn, User, QrCode, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "src/lib/utils";
import { CompanySelector } from "../CompanySelector";
import { TeamSelector } from "../TeamSelector";

interface NavbarProps {
  user: any;
  role: "admin" | "attendee" | "guest";
  currentPath: string;
  companies?: any[];
  teams?: any[];
  selectedCompanyId?: string | null;
  selectedTeamId?: string | null;
  isGlobalAdmin?: boolean;
}

interface NavLink {
  href: string;
  label: string;
}

export const Navbar = ({
  user,
  role,
  currentPath,
  companies = [],
  teams = [],
  selectedCompanyId = null,
  selectedTeamId = null,
  isGlobalAdmin = false,
}: NavbarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const filteredTeams = teams.filter(t => t.company_id === selectedCompanyId);

  const handleCompanyChange = (companyId: string) => {
    document.cookie = `qroll_company_id=${companyId}; path=/; max-age=31536000`;
    const firstTeam = teams.find(t => t.company_id === companyId);
    if (firstTeam) {
      document.cookie = `qroll_team_id=${firstTeam.id}; path=/; max-age=31536000`;
    } else {
      document.cookie = `qroll_team_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
    }
    window.location.reload();
  };

  const handleTeamChange = (teamId: string) => {
    document.cookie = `qroll_team_id=${teamId}; path=/; max-age=31536000`;
    const teamObj = teams.find(t => t.id === teamId);
    if (teamObj) {
      document.cookie = `qroll_company_id=${teamObj.company_id}; path=/; max-age=31536000`;
    }
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCompany = companies.find(c => c.id === selectedCompanyId);
  const companySlug = activeCompany?.slug;

  const links: NavLink[] = [
    { href: "/dashboard", label: "Dashboard" },
    ...(role === "admin" ? [
      { href: "/admin", label: "Events" },
      { href: "/admin/roster", label: "Roster" },
      ...(isGlobalAdmin ? [{ href: "/admin/users", label: "Staff & Admins" }] : []),
      ...(companySlug 
        ? [{ href: `/companies/${companySlug}`, label: "Company" }] 
        : (isGlobalAdmin ? [{ href: "/companies", label: "Companies" }] : [])
      )
    ] : [])
  ].filter(() => role !== "guest");

  const isActive = (href: string) =>
    href === "/dashboard"
      ? currentPath === href
      : href === "/admin"
      ? currentPath === "/admin" || currentPath === "/admin/"
      : currentPath.startsWith(href);

  const initials = (() => {
    const name = user?.user_metadata?.full_name || user?.email || "";
    return name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join("");
  })();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-card border">
              <QrCode className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-base font-semibold tracking-tight">QRoll</span>
          </a>

          {/* Desktop nav */}
          {links.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                    isActive(link.href)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <motion.span
                      layoutId="navbar-active"
                      className="absolute inset-x-2 -bottom-[15px] h-0.5 bg-foreground rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </a>
              ))}
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden md:flex items-center gap-3 mr-2">
                <CompanySelector
                  companies={companies}
                  selectedCompanyId={selectedCompanyId}
                  onChange={handleCompanyChange}
                />
                <TeamSelector
                  teams={filteredTeams}
                  selectedTeamId={selectedTeamId}
                  onChange={handleTeamChange}
                />
              </div>
            )}
            {!user ? (
              <a
                href="/login"
                className="inline-flex cursor-pointer items-center justify-center gap-2 h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 hover:shadow-[0_4px_14px_rgba(47,39,56,0.18)] active:scale-[0.98] transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </a>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserOpen((v) => !v)}
                  className="flex cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#A9DEF9] via-[#E4C1F9] to-[#D0F4DE] text-foreground text-xs font-semibold hover:ring-2 hover:ring-ring/60 hover:scale-105 active:scale-95 transition-all overflow-hidden"
                  aria-label="User menu"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : initials ? (
                    <span>{initials}</span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </button>

                <AnimatePresence>
                  {isUserOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl border bg-popover text-popover-foreground shadow-[0_8px_30px_rgba(47,39,56,0.08),0_2px_8px_rgba(228,193,249,0.18)] p-1.5"
                    >
                      <div className="px-3 py-2">
                        <p className="text-xs text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <a
                        href="/companies"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Create a Company</span>
                      </a>
                      <div className="h-px bg-border my-1" />
                      <form action="/api/auth/signout" method="POST">
                        <button
                          type="submit"
                          className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign out</span>
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {links.length > 0 && (
              <button
                onClick={() => setIsMobileOpen((v) => !v)}
                className="md:hidden cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden overflow-hidden border-t border-border/60 bg-background"
          >
            <nav className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col gap-1">
              {user && (
                <div className="flex flex-col gap-3 px-4 py-2 border-b border-border/60 mb-2">
                  <CompanySelector
                    companies={companies}
                    selectedCompanyId={selectedCompanyId}
                    onChange={handleCompanyChange}
                  />
                  <TeamSelector
                    teams={filteredTeams}
                    selectedTeamId={selectedTeamId}
                    onChange={handleTeamChange}
                  />
                </div>
              )}
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
