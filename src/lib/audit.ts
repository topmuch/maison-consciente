/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Audit Logging Helper

   Fire-and-forget audit logging to UserLog table.
   All errors are silently caught (console.warn) — never throws.
   ═══════════════════════════════════════════════════════ */

import { prisma } from "@/lib/db";

/* ── Types ────────────────────────────────────────────────── */

export interface AuditParams {
  userId?: string | null;
  householdId?: string;
  action: string; // "login" | "login_failed" | "register" | "logout" | "settings_update" | "vault_access" | "subscription_change" | "emergency_call" | "api_config_update" | "safe_arrival_alert" | "payment_failed"
  details?: string;
  status?: "success" | "failure" | "security_alert";
  /** Optional: auto-extract IP and User-Agent from request */
  request?: Request;
}

/* ── Helpers ──────────────────────────────────────────────── */

function extractIP(request: Request): string {
  // x-forwarded-for may contain comma-separated chain: "client, proxy1, proxy2"
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function extractUserAgent(request: Request): string | null {
  return request.headers.get("user-agent") || null;
}

function extractCountry(request: Request): string {
  // Vercel / Edge runtime provides country code
  return request.headers.get("x-vercel-ip-country") || "unknown";
}

/* ── Core: logAction (async) ──────────────────────────────── */

export async function logAction(params: AuditParams): Promise<void> {
  try {
    const { userId, householdId: inputHouseholdId, action, details, status, request } = params;

    // Resolve householdId if missing but userId is present
    let householdId = inputHouseholdId;
    if (!householdId && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { householdId: true },
      });
      householdId = user?.householdId ?? undefined;
    }

    // If still no householdId, we cannot log (schema requires it)
    if (!householdId) {
      console.warn(`[AUDIT] Skipping log — no householdId for action "${action}" (userId: ${userId ?? "none"})`);
      return;
    }

    await prisma.userLog.create({
      data: {
        userId: userId ?? null,
        householdId,
        action,
        details: details ?? null,
        ip: request ? extractIP(request) : null,
        country: request ? extractCountry(request) : "unknown",
        userAgent: request ? extractUserAgent(request) : null,
        status: status ?? "success",
      },
    });
  } catch (error) {
    console.warn("[AUDIT] Failed to log action:", error);
  }
}

/* ── Fire-and-forget variant (non-awaitable) ─────────────── */

export function logActionSync(params: AuditParams): void {
  // Intentionally not awaited — fire and forget
  logAction(params).catch((err) => {
    console.warn("[AUDIT] Unhandled logActionSync error:", err);
  });
}
