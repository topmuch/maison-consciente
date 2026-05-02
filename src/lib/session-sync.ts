/* ═══════════════════════════════════════════════════════
   SESSION SYNC — Client-side session persistence
   
   Handles 3 sources of truth for the session:
   1. URL query param (?s=xxx) — set during login redirect
   2. Cookie (mc-session) — set by server/middleware
   3. localStorage (mc-session) — ultimate client-side fallback
   
   Ensures the session is available for all API calls
   even in iframe/proxy contexts where cookies may be blocked.
   ═══════════════════════════════════════════════════════ */

const STORAGE_KEY = 'mc-session';
const PARAM_KEY = 's';
const COOKIE_NAME = 'mc-session';
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Get the current session ID from any available source.
 * Priority: URL param > cookie > localStorage
 */
export function getSessionId(): string | null {
  // 1. Check URL param (from login redirect)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const paramSession = params.get(PARAM_KEY);
    if (paramSession) {
      // Persist to localStorage and cookie, then clean URL
      persistSession(paramSession);
      cleanUrlParam();
      return paramSession;
    }

    // 2. Check cookie
    const cookieMatch = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
    if (cookieMatch?.[1]) {
      // Also persist to localStorage as backup
      try { localStorage.setItem(STORAGE_KEY, cookieMatch[1]); } catch {}
      return cookieMatch[1];
    }

    // 3. Check localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {}
  }
  return null;
}

/**
 * Persist session to all client-side storage mechanisms.
 */
export function persistSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  
  // localStorage
  try { localStorage.setItem(STORAGE_KEY, sessionId); } catch {}
  
  // Cookie (non-HttpOnly, as fallback — server sets HttpOnly version)
  document.cookie = `${COOKIE_NAME}=${sessionId}; path=/; SameSite=Lax; max-age=${MAX_AGE}`;
}

/**
 * Remove session from all client-side storage.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  document.cookie = `${COOKIE_NAME}=; path=/; SameSite=Lax; max-age=0`;
}

/**
 * Clean the ?s= param from the URL (to avoid leaking session in browser history).
 */
function cleanUrlParam(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  if (url.searchParams.has(PARAM_KEY)) {
    url.searchParams.delete(PARAM_KEY);
    // Preserve other params like ?tab=
    const newUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
    window.history.replaceState({}, '', newUrl);
  }
}

/**
 * Enhanced fetch that always includes the session.
 * Use this for all authenticated API calls from the client.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const sessionId = getSessionId();
  
  const headers = new Headers(init?.headers);
  
  // Always include credentials for cookie-based auth
  const options: RequestInit = {
    ...init,
    credentials: 'include',
    headers,
  };
  
  // Add session as custom header if available (fallback for when cookies don't work)
  if (sessionId) {
    headers.set('x-session-id', sessionId);
  }
  
  return fetch(input, options);
}
