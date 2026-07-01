import React from 'react';

export interface Company {
  id: string;
  name: string;
  slug: string;
}

interface CompanySelectorProps {
  companies: Company[];
  selectedCompanyId: string | null;
  onChange: (companyId: string) => void;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  companies,
  selectedCompanyId,
  onChange,
}) => {
  if (companies.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Company</span>
      <select
        value={selectedCompanyId || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/60 transition-all cursor-pointer"
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
};
