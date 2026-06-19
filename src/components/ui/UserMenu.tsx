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
