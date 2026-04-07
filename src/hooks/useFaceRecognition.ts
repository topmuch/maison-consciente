"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — useFaceRecognition Hook
   Reconnaissance faciale légère et 100% locale.
   Aucune image ne quitte la tablette.

   Pré-requis:
   - npm/bun install face-api.js
   - Placer les modèles dans public/models/face-api/ :
     * tiny_face_detector_model-weights_manifest.json + shard
     * face_landmark_68_tiny_model-weights_manifest.json + shard

   Pour la reconnaissance réelle d'individus, un enrollment
   manuel est nécessaire (stockage des descriptors dans localStorage).
   ═══════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useCallback } from "react";

export type FaceDetectionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "detecting"
  | "detected"
  | "error"
  | "unavailable";

interface FaceDetectionResult {
  detected: boolean;
  faceCount: number;
  label: string;
}

/**
 * Hook de reconnaissance faciale locale via face-api.js
 * @param onDetect - Callback appelé quand un visage est détecté (ou reconnu)
 * @param enabled - Active/désactive la détection
 * @param pollInterval - Intervalle de détection en ms (défaut: 3000)
 */
export function useFaceRecognition(
  onDetect: (result: FaceDetectionResult) => void,
  enabled = true,
  pollInterval = 3000
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<FaceDetectionStatus>("idle");
  const [faceCount, setFaceCount] = useState(0);

  // Stable callback ref to avoid re-creating detection loop
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  /* ─── Chargement des modèles ─── */
  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    if (!("mediaDevices" in navigator)) {
      setStatus("unavailable");
      return;
    }

    let cancelled = false;

    const loadModels = async () => {
      setStatus("loading");
      try {
        const faceapi = await import("face-api.js");
        const MODEL_URL = "/models/face-api";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);

        if (!cancelled) {
          console.log("✅ Modèles face-api chargés");
          setStatus("ready");
        }
      } catch (err) {
        console.error("❌ Erreur chargement modèles face-api:", err);
        if (!cancelled) setStatus("error");
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  /* ─── Démarrage caméra + boucle de détection ─── */
  useEffect(() => {
    if (status !== "ready") return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        const video = videoRef.current;
        if (!video) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 320 },
            height: { ideal: 240 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve);
          };
        });

        // Boucle de détection
        const faceapi = await import("face-api.js");
        intervalRef.current = setInterval(async () => {
          if (cancelled || !videoRef.current) return;

          try {
            setStatus("detecting");
            const detections = await faceapi
              .detectAllFaces(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({
                  inputSize: 224,
                  scoreThreshold: 0.5,
                })
              )
              .withFaceLandmarks(true);

            const count = detections.length;
            setFaceCount(count);

            if (count > 0) {
              setStatus("detected");

              // MVP: Détection de présence uniquement
              // Pour la reconnaissance réelle, comparer les faceDescriptors
              // avec une base de données locale (localStorage).
              onDetectRef.current({
                detected: true,
                faceCount: count,
                label:
                  count === 1
                    ? "Membre détecté"
                    : `${count} personnes détectées`,
              });
            } else {
              setStatus("ready");
            }
          } catch {
            // Silently continue on detection errors
          }
        }, pollInterval);
      } catch (err) {
        console.error("❌ Erreur caméra:", err);
        if (!cancelled) setStatus("error");
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [status, enabled, pollInterval]);

  /* ─── Cleanup complet ─── */
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus("idle");
    setFaceCount(0);
  }, []);

  const restart = useCallback(() => {
    stop();
    setStatus("loading");
    // Trigger re-load by cycling status
    setTimeout(() => setStatus("ready"), 100);
  }, [stop]);

  return {
    videoRef,
    status,
    faceCount,
    stop,
    restart,
  };
}
