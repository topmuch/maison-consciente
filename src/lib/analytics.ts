import posthog from "posthog-js";

let isInitialized = false;

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (isInitialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com";

  if (!key || key === "placeholder") return; // Graceful skip if not configured

  try {
    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: false, // We'll handle this manually
      disable_session_recording: true, // Privacy-first
      loaded: (ph) => {
        ph.register_once({ privacy_mode: true, app: "maison-consciente" });
      },
      persistence: "localStorage+cookie",
      autocapture: false,
    });
    isInitialized = true;
  } catch (err) {
    console.warn("[Analytics] Failed to initialize PostHog:", err);
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!isInitialized) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // Silently fail — analytics should never break the app
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!isInitialized) return;
  try {
    posthog.identify(userId, traits);
  } catch {
    // silent
  }
}

export function resetAnalytics() {
  if (typeof window === "undefined") return;
  if (!isInitialized) return;
  try {
    posthog.reset();
  } catch {
    // silent
  }
}

export { posthog };
