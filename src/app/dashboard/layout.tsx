import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { DashboardClientShell } from "@/components/dashboard/DashboardClientShell";

/* ═══════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Auth Guard + Client Shell

   Server component that validates the session before
   rendering any /dashboard/* page. Passes auth data
   to the client DashboardClientShell which provides
   the TemplateProvider, sidebar, header, and dark mode.
   ═══════════════════════════════════════════════════════ */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const authData = await getAuthUser();

    // Get household details for the sidebar header
    const household = await prisma.household.findUnique({
      where: { id: authData.householdId },
      select: {
        name: true,
        type: true,
        templateSlug: true,
      },
    });

    return (
      <DashboardClientShell
        userName={authData.user.name || authData.user.email}
        userRole={authData.user.role || undefined}
        userAvatar={authData.user.avatar || null}
        householdName={household?.name || "Maison Consciente"}
        initialTemplateSlug={household?.templateSlug || "nexus-modern"}
      >
        {children}
      </DashboardClientShell>
    );
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")
    ) {
      redirect("/?auth=required");
    }
    redirect("/?auth=required");
  }
}
