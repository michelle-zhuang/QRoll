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
