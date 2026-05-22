import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

export default function QRCode({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, { width: 300 }, (error: Error | null | undefined) => {
        if (error) console.error(error);
      });
    }
  }, [value]);

  return <canvas ref={canvasRef} />;
}
