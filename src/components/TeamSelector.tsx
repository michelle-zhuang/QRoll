import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export interface Team {
  id: string;
  name: string;
  company_id: string;
  company_name?: string;
}

export interface Company {
  id: string;
  name: string;
  slug?: string;
}

interface TeamSelectorProps {
  teams: Team[];
  companies?: Company[];
  selectedTeamId: string | null;
  selectedCompanyId?: string | null;
  onChange: (teamId: string) => void;
  className?: string;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  companies = [],
  selectedTeamId,
  selectedCompanyId,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedTeam =
    teams.find((t) => t.id === selectedTeamId) ||
    (teams.length > 0 ? teams[0] : null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (teams.length === 0) {
    return null;
  }

  // If there's only 1 team, render it as a crisp, clear context pill (not interactive)
  if (teams.length === 1) {
    const singleTeam = teams[0];
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-2xl bg-card border border-border/80 shadow-xs text-xs font-medium text-foreground select-none max-w-[160px] sm:max-w-[220px]",
          className
        )}
        title={`Active team: ${singleTeam.name}`}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-xl bg-accent/30 text-accent-foreground shrink-0 font-semibold text-[10px]">
          <Users className="h-3 w-3" />
        </div>
        <span className="truncate">{singleTeam.name}</span>
      </div>
    );
  }

  // Distinct company list if multiple companies are present
  const hasMultipleCompanies = companies.length > 1;

  const renderTeamOption = (t: Team) => {
    const isSelected = t.id === (selectedTeam?.id || selectedTeamId);
    return (
      <button
        key={t.id}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          onChange(t.id);
          setIsOpen(false);
        }}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl transition-all cursor-pointer text-left",
          isSelected
            ? "bg-accent/40 font-semibold text-foreground shadow-xs"
            : "hover:bg-muted/80 text-foreground/90 hover:text-foreground active:scale-[0.99]"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold shrink-0 transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Users className="h-3 w-3" />
          </div>
          <span className="truncate">{t.name}</span>
        </div>
        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
      </button>
    );
  };

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-2xl bg-card hover:bg-muted/70 active:scale-[0.98] border border-border/80 shadow-xs text-xs font-medium text-foreground transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/60 max-w-[150px] sm:max-w-[220px]"
        aria-label={`Select team. Currently selected: ${selectedTeam?.name || 'Select team'}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-xl bg-accent/30 text-accent-foreground shrink-0 font-semibold text-[10px]">
          <Users className="h-3 w-3" />
        </div>
        <span className="truncate">{selectedTeam?.name || 'Select team'}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-150",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            role="listbox"
            className="absolute left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover text-popover-foreground shadow-[0_8px_30px_rgba(47,39,56,0.08),0_2px_8px_rgba(228,193,249,0.18)] p-1.5 z-50 focus:outline-none"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Teams
            </div>

            {hasMultipleCompanies ? (
              companies.map((company) => {
                const companyTeams = teams.filter((t) => t.company_id === company.id);
                if (companyTeams.length === 0) return null;
                return (
                  <div key={company.id} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{company.name}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {companyTeams.map((t) => renderTeamOption(t))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col gap-0.5">
                {teams.map((t) => renderTeamOption(t))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
