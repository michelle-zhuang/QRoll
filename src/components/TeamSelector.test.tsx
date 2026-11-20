import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import { TeamSelector } from './TeamSelector';

afterEach(cleanup);

const mockTeams = [
  { id: 'team-1', name: 'Season 1', company_id: 'comp-1' },
  { id: 'team-2', name: 'Engineering', company_id: 'comp-1' },
  { id: 'team-3', name: 'Design', company_id: 'comp-2' },
];

const mockCompanies = [
  { id: 'comp-1', name: 'Acme Corp', slug: 'acme' },
  { id: 'comp-2', name: 'Design Co', slug: 'design-co' },
];

describe('TeamSelector', () => {
  it('renders a visible badge when there is only 1 team (does not return null)', () => {
    const singleTeam = [mockTeams[0]];
    const onChange = vi.fn();

    render(
      <TeamSelector
        teams={singleTeam}
        selectedTeamId="team-1"
        onChange={onChange}
      />
    );

    // The team name should be clearly visible in the UI
    expect(screen.getByText('Season 1')).toBeInTheDocument();
    // Since there's only 1 team, no interactive dropdown button is needed
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders an interactive selector and opens dropdown when clicked', () => {
    const onChange = vi.fn();

    render(
      <TeamSelector
        teams={mockTeams}
        companies={mockCompanies}
        selectedTeamId="team-1"
        onChange={onChange}
      />
    );

    // Trigger button is present with selected team name
    const trigger = screen.getByRole('button', { name: /select team/i });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('Season 1')).toBeInTheDocument();

    // Open dropdown
    fireEvent.click(trigger);

    // Listbox should be visible
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();

    // Company groups are rendered
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Design Co')).toBeInTheDocument();

    // Click another team
    fireEvent.click(screen.getByText('Engineering'));
    expect(onChange).toHaveBeenCalledWith('team-2');
  });

  it('closes on Escape key press', async () => {
    const onChange = vi.fn();

    render(
      <TeamSelector
        teams={mockTeams}
        companies={mockCompanies}
        selectedTeamId="team-1"
        onChange={onChange}
      />
    );

    const trigger = screen.getByRole('button', { name: /select team/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
