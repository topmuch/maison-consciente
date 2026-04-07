"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — useBarcodeScanner Hook
   Scan de code-barres via la caméra avec html5-qrcode.
   Lookup automatique via OpenFoodFacts API.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useRef, useCallback } from "react";

interface BarcodeScanResult {
  code: string;
  productName: string | null;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
}

interface UseBarcodeScannerOptions {
  fps?: number;
  qrbox?: number;
  autoFocus?: boolean;
}

export function useBarcodeScanner(
  onScan: (result: BarcodeScanResult) => void,
  options: UseBarcodeScannerOptions = {}
) {
  const { fps = 10, qrbox = 250, autoFocus = true } = options;
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);
  const containerRef = useRef<string>("barcode-scanner-" + Math.random().toString(36).slice(2, 8));
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const startScanning = useCallback(async () => {
    setIsScanning(true);
    setError(null);

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      const scanner = new Html5Qrcode(containerRef.current);
      scannerRef.current = scanner;

      const config = {
        fps,
        qrbox: { width: qrbox, height: qrbox / 2 },
        aspectRatio: 1.5,
        formatsToSupport: [
          0, // QR_CODE
          2, // EAN_13
          1, // EAN_8
          3, // UPC_A
          4, // UPC_E
          6, // CODE_128
          7, // CODE_39
        ],
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          // Stop scanning after first successful read
          try {
            await scanner.stop();
            scanner.clear();
          } catch {
            // Ignore cleanup errors
          }
          setIsScanning(false);

          // Lookup in OpenFoodFacts
          let productName: string | null = null;
          let brand: string | null = null;
          let imageUrl: string | null = null;
          let category: string | null = null;

          try {
            const res = await fetch(
              `https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.status === 1 && data.product) {
                productName = data.product.product_name || data.product.product_name_fr || null;
                brand = data.product.brands || null;
                imageUrl = data.product.image_small_url || data.product.image_url || null;
                category = data.product.categories_tags?.[0] || null;
              }
            }
          } catch {
            // OpenFoodFacts lookup failed — continue with just the code
          }

          onScanRef.current({
            code: decodedText,
            productName,
            brand,
            imageUrl,
            category,
          });
        },
        () => {
          // Ignore scanning errors (no QR code found in frame)
        }
      );
    } catch (err) {
      console.error("Barcode scanner error:", err);
      setError(
        err instanceof Error ? err.message : "Impossible d'accéder à la caméra"
      );
      setIsScanning(false);
    }
  }, [fps, qrbox]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current as { stop: () => Promise<void>; clear: () => void };
        await scanner.stop();
        scanner.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const scanner = scannerRef.current as { stop: () => Promise<void>; clear: () => void };
          scanner.stop().catch(() => {});
          scanner.clear();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    containerId: containerRef.current,
    isScanning,
    error,
    startScanning,
    stopScanning,
  };
}
