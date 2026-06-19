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
