import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QRCode from './QRCode';
import QRCodeLib from 'qrcode';

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn(),
  },
}));

describe('QRCode', () => {
  it('renders a canvas and calls QRCodeLib.toCanvas', () => {
    const value = 'https://example.com';
    render(<QRCode value={value} />);
    
    expect(QRCodeLib.toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      value,
      expect.objectContaining({ width: 300 }),
      expect.any(Function)
    );
  });
});
