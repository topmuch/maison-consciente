'use client';

import { useEffect, useRef } from 'react';
import { getSessionId, persistSession } from '@/lib/session-sync';

/* ═══════════════════════════════════════════════════════
   SESSION SYNC COMPONENT
   
   Runs on mount inside the dashboard to ensure the session
   is available from all 3 sources (URL param, cookie, localStorage).
   
   Also patches global fetch to always include the x-session-id header,
   ensuring all API calls work even when cookies are blocked.
   ═══════════════════════════════════════════════════════ */

export function SessionSync() {
  const patched = useRef(false);

  useEffect(() => {
    // Sync session from URL param / localStorage / cookie
    const sessionId = getSessionId();
    
    if (sessionId && !patched.current) {
      patched.current = true;
      
      // Ensure session is in localStorage and cookie
      persistSession(sessionId);
      
      // Patch global fetch to always include x-session-id header
      // This ensures ALL fetch calls in the app carry the session
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        const headers = new Headers(init?.headers);
        headers.set('x-session-id', sessionId);
        
        return originalFetch.call(this, input, {
          ...init,
          credentials: (init?.credentials || 'include') as RequestCredentials,
          headers,
        });
      };
      
      console.log('[SessionSync] Session patched into fetch');
    }
  }, []);

  return null; // No UI rendered
}
