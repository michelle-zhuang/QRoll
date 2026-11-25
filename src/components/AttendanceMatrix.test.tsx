import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AttendanceMatrix } from './AttendanceMatrix';
import type { AttendanceData } from 'src/lib/attendanceTypes';

const mockData: AttendanceData = {
  dates: ['2026-06-01', '2026-06-02'],
  attendees: [
    {
      id: 'member-1',
      name: 'Alex Rivera',
      records: [
        { date: '2026-06-01', status: 'present', reason: null },
        { date: '2026-06-02', status: 'absent', reason: null }
      ]
    }
  ]
};

describe('AttendanceMatrix Scroll Elements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.defineProperty(HTMLDivElement.prototype, 'scrollWidth', { configurable: true, value: 500 });
    Object.defineProperty(HTMLDivElement.prototype, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(HTMLDivElement.prototype, 'scrollLeft', { configurable: true, writable: true, value: 10 });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete (HTMLDivElement.prototype as any).scrollWidth;
    delete (HTMLDivElement.prototype as any).clientWidth;
    delete (HTMLDivElement.prototype as any).scrollLeft;
  });

  it('renders chevrons and scroll container', () => {
    render(<AttendanceMatrix data={mockData} />);
    
    const leftBtn = screen.getByLabelText('Scroll left');
    const rightBtn = screen.getByLabelText('Scroll right');
    
    expect(leftBtn).toBeDefined();
    expect(rightBtn).toBeDefined();
  });

  it('scrolls the container when clicking buttons', () => {
    const scrollBySpy = vi.fn();
    Object.defineProperty(HTMLDivElement.prototype, 'scrollBy', {
      configurable: true,
      writable: true,
      value: scrollBySpy
    });

    render(<AttendanceMatrix data={mockData} />);

    const leftBtn = screen.getByLabelText('Scroll left');
    const rightBtn = screen.getByLabelText('Scroll right');

    fireEvent.click(leftBtn);
    expect(scrollBySpy).toHaveBeenCalledWith(
      expect.objectContaining({ left: -200, behavior: 'smooth' })
    );

    fireEvent.click(rightBtn);
    expect(scrollBySpy).toHaveBeenCalledWith(
      expect.objectContaining({ left: 200, behavior: 'smooth' })
    );

    delete (HTMLDivElement.prototype as any).scrollBy;
  });

  it('calls noteApiUrl with team_member_id when editing and saving notes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"ok":true}')
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AttendanceMatrix data={mockData} noteApiUrl="/api/attendance/note" />);

    // Click the cell to open the editor
    const cell = screen.getByLabelText('Alex Rivera 2026-06-01 Present');
    fireEvent.click(cell);

    // Write a note in the textarea
    const textarea = screen.getByPlaceholderText(/e.g. Sick/i);
    fireEvent.change(textarea, { target: { value: 'Excused' } });

    // Click Save changes
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Check fetch was called with correct payload including team_member_id
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/attendance/note',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          team_member_id: 'member-1',
          date: '2026-06-01',
          note: 'Excused',
          status: 'present'
        })
      })
    );

    vi.unstubAllGlobals();
  });
});
