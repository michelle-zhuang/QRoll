import React from 'react';

export interface Team {
  id: string;
  name: string;
  company_id: string;
}

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string | null;
  onChange: (teamId: string) => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  selectedTeamId,
  onChange,
}) => {
  if (teams.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Team</span>
      <select
        value={selectedTeamId || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/60 transition-all cursor-pointer"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};
