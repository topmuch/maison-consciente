'use client';

import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useVoiceResponse } from '@/hooks/useVoiceResponse';

interface CustomQRProps {
  zoneName: string;
  qrCode: string;
  size?: number;
  color?: string; // hex color for QR
  showExport?: boolean;
}

export function CustomQR({ zoneName, qrCode, size = 280, color = '#fbbf24', showExport = true }: CustomQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { speak } = useVoiceResponse();

  const scanUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/scan/${qrCode}`
    : `/scan/${qrCode}`;

  const exportPNG = useCallback(async () => {
    setExporting(true);
    try {
      const qrDiv = qrRef.current;
      if (!qrDiv) return;

      const svgEl = qrDiv.querySelector('svg');
      if (!svgEl) return;

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvasSize = size + 40; // padding
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // QR code
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      });
      const qrOffset = 20;
      ctx.drawImage(img, qrOffset, qrOffset, size, size);

      // Logo overlay ("MC")
      const logoSize = Math.round(size * 0.22);
      const logoX = (canvasSize - logoSize) / 2;
      const logoY = (canvasSize - logoSize) / 2;

      // Logo background circle
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
      ctx.fillStyle = '#020617';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // "MC" text
      ctx.fillStyle = '#020617';
      ctx.font = `bold ${Math.round(logoSize * 0.55)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MC', canvasSize / 2, canvasSize / 2 + 1);

      // Download
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `qr-${qrCode}.png`;
      a.click();

      speak(`QR Code de ${zoneName} exporté avec succès`);
    } catch {
      // silent fallback
    } finally {
      setExporting(false);
    }
  }, [size, qrCode, zoneName, color, speak]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* QR Code with dark background */}
        <motion.div
          ref={qrRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="p-4 rounded-2xl shadow-lg"
          style={{ backgroundColor: '#020617' }}
        >
          <QRCode
            value={scanUrl}
            size={size}
            bgColor="#020617"
            fgColor={color}
            level="H"
          />
        </motion.div>

        {/* Center logo overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ padding: '28px' }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: `${Math.round(size * 0.22)}px`,
              height: `${Math.round(size * 0.22)}px`,
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}40`,
            }}
          >
            <span
              className="font-bold"
              style={{
                color: '#020617',
                fontSize: `${Math.round(size * 0.12)}px`,
                lineHeight: 1,
              }}
            >
              MC
            </span>
          </div>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Zone name */}
      <p className="text-sm font-serif font-semibold text-[#e2e8f0]">{zoneName}</p>

      {/* Export button */}
      {showExport && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={exportPNG}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-gold text-[#0a0a12] text-sm font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] hover:shadow-[0_0_24px_var(--accent-primary-glow)] transition-all duration-400 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Télécharger PNG
        </motion.button>
      )}
    </div>
  );
}
