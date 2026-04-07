/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Health Check Endpoint
   
   Public endpoint for Docker healthcheck, load balancers,
   and monitoring services. Returns 200 with system status.
   ═══════════════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const APP_VERSION = process.env.npm_package_version || "1.0.0";
const START_TIME = Date.now();

export async function GET() {
  const checks: Record<string, { status: "ok" | "error" | "degraded"; latency?: number; detail?: string }> = {};

  // ─── Database Check ───
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database = {
      status: "ok",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "error",
      detail: "Connection failed",
    };
  }

  // ─── External Services Check (API Config) ───
  try {
    const apiConfigs = await db.apiConfig.findMany({
      select: {
        serviceKey: true,
        isActive: true,
        status: true,
        lastTested: true,
      },
    });

    const external: Record<string, { status: "ok" | "error" | "unknown" | "inactive"; lastTested: string | null }> = {};
    for (const config of apiConfigs) {
      const serviceStatus = config.isActive
        ? (config.status === "ok" ? "ok" : config.status === "error" ? "error" : "unknown")
        : "inactive";
      external[config.serviceKey] = {
        status: serviceStatus,
        lastTested: config.lastTested?.toISOString() ?? null,
      };
    }
    checks.external = {
      status: apiConfigs.length > 0 && apiConfigs.every((c) => !c.isActive || c.status === "ok") ? "ok" : "degraded",
    };
    (checks.external as Record<string, unknown>).services = external;
  } catch {
    checks.external = {
      status: "degraded",
      detail: "Could not read API config",
    };
  }

  // ─── Calculate uptime ───
  const uptimeMs = Date.now() - START_TIME;
  const uptimeSec = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;

  const coreChecksOk = Object.entries(checks)
    .filter(([key]) => key !== "external")
    .every(([, c]) => c.status === "ok");

  return NextResponse.json(
    {
      status: coreChecksOk ? "healthy" : "degraded",
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptime: `${hours}h ${minutes}m ${seconds}s`,
      environment: process.env.NODE_ENV || "development",
      checks,
    },
    {
      status: coreChecksOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Health-Status": coreChecksOk ? "healthy" : "degraded",
      },
    }
  );
}
