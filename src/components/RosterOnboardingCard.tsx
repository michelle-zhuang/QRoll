import { useState, useMemo } from 'react';

type RosterMember = {
  id: string;
  full_name: string;
  email: string | null;
};

type Props = {
  fuzzyMatches: RosterMember[];
  allUnclaimed: RosterMember[];
  /** URL to redirect to after successful linking */
  redirectTo: string;
  teamId: string;
};


type Tab = 'matches' | 'search' | 'new';

export function RosterOnboardingCard({ fuzzyMatches, allUnclaimed, redirectTo, teamId }: Props) {
  const [tab, setTab] = useState<Tab>(fuzzyMatches.length > 0 ? 'matches' : 'search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return allUnclaimed;
    const q = searchQuery.toLowerCase();
    return allUnclaimed.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q)
    );
  }, [searchQuery, allUnclaimed]);

  async function submit() {
    setError(null);
    setLoading(true);

    let body: Record<string, string>;
    if (tab === 'new') {
      if (!newName.trim()) { setError('Name is required.'); setLoading(false); return; }
      body = { teamId, newName };
    } else {
      if (!selectedId) { setError('Please select a roster member.'); setLoading(false); return; }
      body = { teamId, teamMemberId: selectedId };
    }

    try {
      const res = await fetch('/api/team-members/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || 'Something went wrong.');
        setLoading(false);
        return;
      }

      // Reload the page so the check-in flow continues normally
      window.location.href = redirectTo;
    } catch (e: any) {
      setError(e?.message ?? 'Network error.');
      setLoading(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    ...(fuzzyMatches.length > 0 ? [{ id: 'matches' as Tab, label: '✨ Suggestions' }] : []),
    { id: 'search', label: '🔍 Search' },
    { id: 'new', label: '+ New entry' },
  ];

  return (
    <div className="roster-onboarding">
      <style>{`
        .roster-onboarding {
          font-family: 'Inter', system-ui, sans-serif;
        }
        .rob-tabs {
          display: flex;
          gap: 4px;
          background: color-mix(in srgb, var(--muted) 50%, transparent);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 18px;
        }
        .rob-tab {
          flex: 1;
          padding: 7px 10px;
          border-radius: 7px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          color: var(--muted-foreground);
          transition: all 0.18s ease;
        }
        .rob-tab.active {
          background: var(--card);
          color: var(--foreground);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .rob-tab:hover:not(.active) {
          color: var(--foreground);
        }
        .rob-match-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rob-match-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          cursor: pointer;
          transition: all 0.18s ease;
          background: var(--card);
        }
        .rob-match-card:hover {
          border-color: color-mix(in srgb, var(--primary) 60%, transparent);
          background: color-mix(in srgb, var(--primary) 4%, transparent);
        }
        .rob-match-card.selected {
          border-color: var(--primary);
          background: color-mix(in srgb, var(--primary) 8%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
        }
        .rob-match-name { font-weight: 600; font-size: 14px; }
        .rob-match-email { font-size: 12px; color: var(--muted-foreground); margin-top: 2px; }
        .rob-check {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s;
          flex-shrink: 0;
        }
        .rob-match-card.selected .rob-check {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .rob-search {
          width: 100%;
          padding: 9px 13px;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--card);
          font-size: 14px;
          color: var(--foreground);
          margin-bottom: 10px;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .rob-search:focus { border-color: color-mix(in srgb, var(--primary) 70%, transparent); }
        .rob-scroll {
          max-height: 220px;
          overflow-y: auto;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .rob-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 13px;
          cursor: pointer;
          transition: background 0.12s;
          border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
        }
        .rob-item:last-child { border-bottom: none; }
        .rob-item:hover { background: color-mix(in srgb, var(--muted) 40%, transparent); }
        .rob-item.selected { background: color-mix(in srgb, var(--primary) 8%, transparent); }
        .rob-item-radio {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid var(--border);
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .rob-item.selected .rob-item-radio {
          background: var(--primary);
          border-color: var(--primary);
        }
        .rob-empty { padding: 24px; text-align: center; color: var(--muted-foreground); font-size: 13px; }
        .rob-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 12px;
        }
        .rob-label { font-size: 12px; font-weight: 500; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.05em; }
        .rob-input {
          width: 100%;
          padding: 9px 13px;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--card);
          font-size: 14px;
          color: var(--foreground);
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .rob-input:focus { border-color: color-mix(in srgb, var(--primary) 70%, transparent); }
        .rob-error {
          background: color-mix(in srgb, var(--destructive) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--destructive) 30%, transparent);
          color: var(--destructive);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          margin-top: 10px;
        }
        .rob-btn {
          width: 100%;
          padding: 12px;
          border-radius: 9px;
          border: none;
          background: var(--primary);
          color: var(--primary-foreground);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 14px;
          transition: opacity 0.18s, transform 0.12s;
        }
        .rob-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .rob-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="rob-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`rob-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => { setTab(t.id); setSelectedId(null); setError(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Suggestions tab */}
      {tab === 'matches' && (
        <div className="rob-match-list">
          {fuzzyMatches.map((m) => (
            <div
              key={m.id}
              className={`rob-match-card${selectedId === m.id ? ' selected' : ''}`}
              onClick={() => setSelectedId(m.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedId(m.id)}
            >
              <div>
                <div className="rob-match-name">{m.full_name}</div>
                {m.email && <div className="rob-match-email">{m.email}</div>}
              </div>
              <div className="rob-check">
                {selectedId === m.id && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M10 3L5 9 2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <>
          <input
            className="rob-search"
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="rob-scroll">
            {filteredMembers.length === 0 ? (
              <div className="rob-empty">No members found</div>
            ) : (
              filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className={`rob-item${selectedId === m.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(m.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedId(m.id)}
                >
                  <div className="rob-item-radio" />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{m.full_name}</div>
                    {m.email && <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{m.email}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* New entry tab */}
      {tab === 'new' && (
        <>
          <div className="rob-field">
            <label className="rob-label" htmlFor="rob-new-name">Full Name *</label>
            <input
              id="rob-new-name"
              className="rob-input"
              type="text"
              placeholder="Your full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </div>
        </>
      )}

      {error && <div className="rob-error">{error}</div>}

      {(() => {
        const isSubmitDisabled = loading || (tab !== 'new' && !selectedId);
        const selectedMemberName = (() => {
          if (tab === 'new') return '';
          const list = tab === 'matches' ? fuzzyMatches : allUnclaimed;
          return list.find(m => m.id === selectedId)?.full_name ?? '';
        })();

        let buttonText = 'Confirm & Continue';
        if (loading) {
          buttonText = tab === 'new' ? 'Creating…' : 'Linking…';
        } else if (tab === 'new') {
          buttonText = newName.trim() ? `Register as "${newName.trim()}"` : 'Enter name to register';
        } else if (selectedMemberName) {
          buttonText = `Confirm & Link as ${selectedMemberName}`;
        } else {
          buttonText = 'Select a name above to continue';
        }

        return (
          <button className="rob-btn" onClick={submit} disabled={isSubmitDisabled}>
            {buttonText}
          </button>
        );
      })()}
    </div>
  );
}
