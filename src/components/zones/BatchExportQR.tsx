'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Loader2, QrCode, CheckCircle2 } from 'lucide-react';
import { useVoiceResponse } from '@/hooks/useVoiceResponse';

interface ZoneInfo {
  id: string;
  name: string;
  qrCode: string;
  color: string;
}

interface BatchExportQRProps {
  zones: ZoneInfo[];
}

export function BatchExportQR({ zones }: BatchExportQRProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const { speak } = useVoiceResponse();

  const handleExport = useCallback(async () => {
    if (zones.length === 0) return;
    setExporting(true);
    setExported(false);

    try {
      // Dynamic import to avoid SSR issues
      const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');

      const scanUrl = (code: string) => {
        if (typeof window !== 'undefined') return `${window.location.origin}/scan/${code}`;
        return `/scan/${code}`;
      };

      // Generate QR codes as data URLs using canvas
      const QRCodeModule = await import('react-qr-code');
      const React = await import('react');
      const ReactDOMServer = await import('react-dom/server');

      const qrDataUrls: { url: string; zone: ZoneInfo }[] = [];

      for (const zone of zones) {
        const url = scanUrl(zone.qrCode);
        // Create SVG string then convert to canvas
        const qrElement = React.createElement(QRCodeModule.default, {
          value: url,
          size: 200,
          bgColor: '#ffffff',
          fgColor: '#0a0a12',
          level: 'H' as const,
        });
        const svgString = ReactDOMServer.renderToStaticMarkup(qrElement);

        // Convert SVG to canvas to get data URL
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
          });
          ctx.drawImage(img, 0, 0, 200, 200);
        }
        qrDataUrls.push({ url: canvas.toDataURL('image/png'), zone });
      }

      // Split zones into pages of 4
      const pages: { url: string; zone: ZoneInfo }[][] = [];
      for (let i = 0; i < qrDataUrls.length; i += 4) {
        pages.push(qrDataUrls.slice(i, i + 4));
      }

      // PDF Styles
      const styles = StyleSheet.create({
        page: {
          padding: 40,
          backgroundColor: '#020617',
          flexDirection: 'column',
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 12,
          borderBottomColor: '#fbbf24',
          borderBottomWidth: 1,
        },
        title: {
          fontSize: 18,
          fontFamily: 'Helvetica-Bold',
          color: '#fbbf24',
        },
        date: {
          fontSize: 10,
          color: '#94a3b8',
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 16,
        },
        card: {
          width: '47%',
          padding: 12,
          marginBottom: 12,
          backgroundColor: '#0f172a',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#1e293b',
          alignItems: 'center',
        },
        cardTitle: {
          fontSize: 11,
          fontFamily: 'Helvetica-Bold',
          color: '#e2e8f0',
          marginBottom: 4,
          textAlign: 'center' as const,
        },
        cardSlug: {
          fontSize: 8,
          color: '#64748b',
          marginBottom: 8,
          textAlign: 'center' as const,
        },
        footer: {
          position: 'absolute',
          bottom: 20,
          left: 40,
          right: 40,
          flexDirection: 'row',
          justifyContent: 'center',
        },
        footerText: {
          fontSize: 8,
          color: '#475569',
        },
        cutLine: {
          position: 'absolute',
          bottom: 32,
          left: 30,
          right: 30,
          borderBottomColor: '#334155',
          borderBottomWidth: 0.5,
          borderStyle: 'dashed',
        },
      });

      // Build PDF document
      const QRPdfDocument = () => (
        <Document>
          {pages.map((page, pageIndex) => (
            <Page key={pageIndex} size="A4" style={styles.page}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Maison Consciente — QR Codes</Text>
                <Text style={styles.date}>
                  {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>

              {/* QR Grid */}
              <View style={styles.grid}>
                {page.map(({ url, zone }) => (
                  <View key={zone.id} style={styles.card} wrap={false}>
                    <Text style={styles.cardTitle}>{zone.name}</Text>
                    <Text style={styles.cardSlug}>{zone.qrCode}</Text>
                    {(pdf as any).Image && <img src={url} style={{ width: 140, height: 140 }} alt={zone.name} />}
                  </View>
                ))}
              </View>

              {/* Cut line */}
              <View style={styles.cutLine} />

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Page {pageIndex + 1} / {pages.length} — Maison Consciente — Imprimez et découpez
                </Text>
              </View>
            </Page>
          ))}
        </Document>
      );

      // Generate PDF blob and download
      const blob = await pdf(<QRPdfDocument />).toBlob();
      const pdfUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `qr-codes-maison-consciente-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(pdfUrl);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
      speak(`Export réussi. ${zones.length} zone${zones.length > 1 ? 's' : ''} imprimée${zones.length > 1 ? 's' : ''} en ${pages.length} page${pages.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  }, [zones, speak]);

  return (
    <div className="glass rounded-2xl inner-glow border-white/[0.06] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
            <FileDown className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-semibold text-[#e2e8f0]">
              Export PDF Batch
            </h3>
            <p className="text-xs text-[#64748b]">
              {zones.length} zone{zones.length !== 1 ? 's' : ''} · {Math.max(1, Math.ceil(zones.length / 4))} page{Math.ceil(zones.length / 4) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          disabled={exporting || zones.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-gold text-[#0a0a12] text-sm font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] transition-all duration-400 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exported ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {exported ? 'Exporté !' : 'Télécharger le PDF'}
        </motion.button>
      </div>

      {/* Preview of zones */}
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
            >
              <QrCode className="w-3 h-3 text-[var(--accent-primary)]" />
              <span className="text-xs text-[#94a3b8]">{zone.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
