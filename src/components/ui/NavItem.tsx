import { motion } from "framer-motion";
import { useState } from "react";

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
}

export const NavItem = ({ href, label, isActive }: NavItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
    >
      {label}
      {(isActive || isHovered) && (
        <motion.div
          layoutId="navbar-hover"
          className="absolute inset-0 bg-slate-900/10 rounded-full -z-10"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </a>
  );
};
