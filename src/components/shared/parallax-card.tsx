'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// ═══════════════════════════════════════════════════════
// Subtle Parallax Card — Maison Consciente
// On mobile, uses Framer Motion for tilt effect based on
// device orientation (useMotionValue, useTransform)
// On desktop, uses mouse position for subtle hover tilt
// ═══════════════════════════════════════════════════════

interface ParallaxCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number; // 0-1, default 0.3
}

export function ParallaxCard({ children, className = '', intensity = 0.3 }: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  // Motion values for tilt
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // Smooth spring physics
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  // Glare effect based on rotation
  // (removed to avoid Framer Motion DOM prop warning)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
      setIsEnabled(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mouse move handler for desktop
  useEffect(() => {
    if (isMobile || !ref.current) return;

    const el = ref.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      rotateX.set(deltaY * -6 * intensity);
      rotateY.set(deltaX * 6 * intensity);
    };

    const handleMouseLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isMobile, intensity, rotateX, rotateY]);

  // Device orientation handler for mobile
  useEffect(() => {
    if (!isMobile) return;

    let mounted = true;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!mounted) return;

      const gamma = e.gamma || 0; // left-right tilt (-90 to 90)
      const beta = e.beta || 0;   // front-back tilt (-180 to 180)

      // Clamp and normalize
      const clampedGamma = Math.max(-30, Math.min(30, gamma)) / 30;
      const clampedBeta = Math.max(-30, Math.min(30, beta - 45)) / 30;

      rotateX.set(clampedBeta * -5 * intensity);
      rotateY.set(clampedGamma * 5 * intensity);
    };

    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      // We can't request permission without user gesture, so we listen for it
      const handleInteraction = async () => {
        try {
          const perm = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
          if (perm === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch {
          // Permission denied, fall back to no parallax
          setIsEnabled(false);
        }
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      };

      window.addEventListener('click', handleInteraction, { once: true });
      window.addEventListener('touchstart', handleInteraction, { once: true });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      mounted = false;
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isMobile, intensity, rotateX, rotateY]);

  // Don't apply parallax on SSR or if disabled
  if (!isEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d',
        perspective: 800,
      }}
    >
      {children}
    </motion.div>
  );
}
