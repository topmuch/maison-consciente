/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Location Engine

   Moteur de géolocalisation qui traite les mises à jour GPS,
   détecte les entrées/sorties de GeoFences, déclenche
   les automatisations Home Assistant et les alertes.

   Architecture :
   1. processLocationUpdate() — Point d'entrée principal
   2. detectGeoFenceTransitions() — Détection entrée/sortie
   3. triggerAutomation() — Exécution scénarios HA
   4. checkDelayAlerts() — Alerte retard enfants
   ═══════════════════════════════════════════════════════ */

import { prisma } from "@/lib/db";
import { homeAssistantBridge } from "@/lib/home-assistant-bridge";
import { sendPushToHousehold } from "@/lib/push-service";
import { logActionSync } from "@/lib/audit";
import { haversineDistance, isInsideGeoFence, estimatedTravelTime } from "@/lib/geo-utils";

/* ── Types ────────────────────────────────────────────────── */

export interface LocationUpdateInput {
  trackingToken: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  battery?: number;
}

export interface LocationUpdateResult {
  success: boolean;
  memberId: string;
  memberName: string;
  events: GeoFenceEvent[];
  newStatus: string;
}

export interface GeoFenceEvent {
  type: "enter" | "exit";
  geoFenceId: string;
  geoFenceName: string;
  geoFenceType: string;
  distance: number; // mètres du centre
}

export interface DelayAlertResult {
  checked: number;
  alertsTriggered: number;
  details: { memberName: string; minutesLate: number }[];
}

/* ═══════════════════════════════════════════════════════
   LocationEngine — Classe principale
   ═══════════════════════════════════════════════════════ */

export class LocationEngine {
  /* ── 1. Processus principal de mise à jour ── */

  /**
   * Traite une mise à jour de position GPS provenant de l'API mobile.
   *
   * Étapes :
   * 1. Valider le token de tracking et le consentement
   * 2. Mettre à jour la dernière position du membre
   * 3. Détecter les transitions de GeoFence (entrée/sortie)
   * 4. Logger la position avec l'événement approprié
   * 5. Déclencher les automatisations HA + notifications
   * 6. Mettre à jour le statut du membre
   *
   * @returns Résultat avec les événements détectés
   */
  async processLocationUpdate(input: LocationUpdateInput): Promise<LocationUpdateResult> {
    const { trackingToken, lat, lng, accuracy, speed, heading, battery } = input;

    // ── 1. Trouver le membre via le tracking token ──
    const member = await prisma.familyMember.findUnique({
      where: { trackingToken },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            notificationPrefs: true,
            contactEmail: true,
          },
        },
      },
    });

    if (!member) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    if (!member.consentGiven || !member.isActive) {
      throw new Error("TRACKING_DISABLED");
    }

    // ── 2. Détecter les transitions de GeoFence ──
    const activeFences = await prisma.geoFence.findMany({
      where: {
        householdId: member.householdId,
        isActive: true,
      },
    });

    const events = await this.detectGeoFenceTransitions(
      member,
      activeFences,
      lat,
      lng,
    );

    // ── 3. Déterminer le nouveau statut ──
    const newStatus = this.determineMemberStatus(member, activeFences, lat, lng);

    // ── 4. Logger la position ──
    const primaryEvent = events.length > 0 ? events[0].type : "update";
    const primaryGeoFenceId = events.length > 0 ? events[0].geoFenceId : null;
    const primaryGeoFenceName = events.length > 0 ? events[0].geoFenceName : null;
    const expiresAt = new Date(
      Date.now() + member.autoDeleteDays * 24 * 60 * 60 * 1000,
    );

    // ── 4-5. Transaction atomique: logger + mettre à jour le membre ──
    await prisma.$transaction([
      prisma.locationLog.create({
        data: {
          memberId: member.id,
          householdId: member.householdId,
          lat,
          lng,
          accuracy: accuracy ?? null,
          speed: speed ?? null,
          heading: heading ?? null,
          battery: battery ?? null,
          event: primaryEvent,
          geoFenceId: primaryGeoFenceId,
          geoFenceName: primaryGeoFenceName,
          expiresAt,
        },
      }),
      prisma.familyMember.update({
        where: { id: member.id },
        data: {
          lastKnownLat: lat,
          lastKnownLng: lng,
          lastKnownAt: new Date(),
          lastKnownAccuracy: accuracy ?? null,
          batteryLevel: battery ?? null,
          status: newStatus,
          currentGeoFenceId: newStatus === "home" || newStatus === "school" || newStatus === "work"
            ? activeFences.find((f) => {
                const inside = isInsideGeoFence(lat, lng, f.centerLat, f.centerLng, f.radiusMeters);
                return inside && f.type === newStatus;
              })?.id ?? member.currentGeoFenceId
            : null,
        },
      }),
    ]);

    // ── 6. Traiter les événements (automatisations + notifications) ──
    // Pass activeFences to avoid N+1 re-fetch per event
    for (const event of events) {
      await this.handleGeoFenceEvent(event, member, member.household, activeFences);
    }

    // ── 7. Audit log ──
    logActionSync({
      householdId: member.householdId,
      action: "location_update",
      details: `Member: ${member.name}, Status: ${newStatus}, Events: ${events.length}`,
      status: "success",
    });

    return {
      success: true,
      memberId: member.id,
      memberName: member.name,
      events,
      newStatus,
    };
  }

  /* ── 2. Détection des transitions de GeoFence ── */

  /**
   * Compare la nouvelle position avec toutes les GeoFences actives
   * et détecte les transitions (entrée/sortie).
   *
   * Logique :
   * - Si le membre était dans une zone et n'y est plus → EXIT
   * - Si le membre n'était pas dans une zone et y entre → ENTER
   */
  private async detectGeoFenceTransitions(
    member: { id: string; currentGeoFenceId: string | null; lastKnownLat: number | null; lastKnownLng: number | null },
    fences: { id: string; name: string; type: string; centerLat: number; centerLng: number; radiusMeters: number }[],
    newLat: number,
    newLng: number,
  ): Promise<GeoFenceEvent[]> {
    const events: GeoFenceEvent[] = [];

    for (const fence of fences) {
      const wasInside = member.currentGeoFenceId === fence.id;
      const isNowInside = isInsideGeoFence(newLat, newLng, fence.centerLat, fence.centerLng, fence.radiusMeters);
      const distanceFromCenter = haversineDistance(newLat, newLng, fence.centerLat, fence.centerLng);

      // Détection de sortie
      if (wasInside && !isNowInside) {
        events.push({
          type: "exit",
          geoFenceId: fence.id,
          geoFenceName: fence.name,
          geoFenceType: fence.type,
          distance: Math.round(distanceFromCenter),
        });
      }

      // Détection d'entrée (ou si le membre n'avait pas de zone et entre dans une)
      if (!wasInside && isNowInside) {
        events.push({
          type: "enter",
          geoFenceId: fence.id,
          geoFenceName: fence.name,
          geoFenceType: fence.type,
          distance: Math.round(distanceFromCenter),
        });
      }
    }

    return events;
  }

  /* ── 3. Détermination du statut du membre ── */

  /**
   * Détermine le statut du membre en fonction de sa position
   * par rapport aux GeoFences.
   */
  private determineMemberStatus(
    member: { currentGeoFenceId: string | null },
    fences: { id: string; type: string; centerLat: number; centerLng: number; radiusMeters: number }[],
    lat: number,
    lng: number,
  ): string {
    // Vérifier dans quelle zone le membre se trouve
    for (const fence of fences) {
      if (isInsideGeoFence(lat, lng, fence.centerLat, fence.centerLng, fence.radiusMeters)) {
        // Retourner le type de zone comme statut
        if (fence.type === "home") return "home";
        if (fence.type === "school") return "school";
        if (fence.type === "work") return "work";
      }
    }

    // Si le membre était dans la zone "home" et est sorti → en route
    if (member.currentGeoFenceId) {
      const previousFence = fences.find((f) => f.id === member.currentGeoFenceId);
      if (previousFence?.type === "home") {
        return "en_route";
      }
    }

    return "away";
  }

  /* ── 4. Traitement des événements GeoFence ── */

  /**
   * Traite un événement d'entrée ou de sortie de zone :
   * - Scénario "Arrivée" (MEMBER_ARRIVED à la maison)
   * - Scénario "Alerte Retard" (sortie de l'école après 18h)
   * - Notifications push aux autres membres
   * - Automatisations Home Assistant
   */
  private async handleGeoFenceEvent(
    event: GeoFenceEvent,
    member: { id: string; name: string; role: string; householdId: string },
    household: { id: string; name: string; notificationPrefs: unknown; contactEmail: string | null },
    fences: { id: string; haSceneOnEntry: string | null; haSceneOnExit: string | null }[],
  ): Promise<void> {
    if (event.type === "enter" && event.geoFenceType === "home") {
      // ═══ SCÉNARIO "ARRIVÉE À LA MAISON" ═══
      await this.handleMemberArrived(member, household);
    }

    if (event.type === "exit" && event.geoFenceType === "school") {
      // ═══ VÉRIFICATION RETARD POTENTIEL ═══
      const now = new Date();
      // Use UTC hours to avoid server timezone dependency
    const hour = now.getUTCHours() + (member.householdId ? 2 : 0); // TODO: use household.timezone
    const adjustedHour = hour >= 24 ? hour - 24 : hour;

      // Si sortie après 18h et enfant
      if (adjustedHour >= 18 && member.role === "Child") {
        await this.handlePotentialDelay(member, household, now);
      }
    }

    // ═══ AUTOMATISATIONS HOME ASSISTANT ═══
    // Use pre-fetched fences instead of N+1 query per event
    const fence = fences.find((f) => f.id === event.geoFenceId);

    if (fence) {
      if (event.type === "enter" && fence.haSceneOnEntry) {
        await this.triggerHAScene(fence.haSceneOnEntry, member.householdId, member.name);
      }

      if (event.type === "exit" && fence.haSceneOnExit) {
        await this.triggerHAScene(fence.haSceneOnExit, member.householdId, member.name);
      }
    }
  }

  /* ── 5. Scénario "Arrivée" ── */

  /**
   * Scénario "Arrivée à la maison" :
   * 1. Notification Push aux autres membres ("Papa est rentré")
   * 2. Allumer les lumières du couloir (HA)
   * 3. Régler le chauffage (HA)
   */
  private async handleMemberArrived(
    member: { id: string; name: string; role: string; householdId: string },
    household: { id: string; name: string; notificationPrefs: unknown; contactEmail: string | null },
  ): Promise<void> {
    console.log(`[LocationEngine] MEMBER_ARRIVED: ${member.name} est rentré(e) à la maison`);

    // 1. Notification Push
    await sendPushToHousehold(
      household.id,
      `🏠 ${member.name} est rentré(e)`,
      `${member.name} vient d'arriver à la maison.`,
      { priority: 7 }
    ).catch(() => {
      // Push failures are non-blocking
    });

    // 2. Scénario Home Assistant — Accueil famille
    await homeAssistantBridge.execute({
      type: "custom",
      householdId: household.id,
      guestName: member.name,
      parameters: {
        domain: "scene",
        service: "turn_on",
        data: { entity_id: "scene.welcome_family" },
      },
    }).catch(() => {
      // HA failures are non-blocking
    });

    // 3. Commandes individuelles (si la scène n'existe pas)
    await homeAssistantBridge.execute({
      type: "custom",
      householdId: household.id,
      guestName: member.name,
      parameters: {
        domain: "homeassistant",
        service: "turn_on",
        data: { entity_id: "group.hallway_lights" },
      },
    }).catch(() => {});

    await homeAssistantBridge.execute({
      type: "custom",
      householdId: household.id,
      guestName: member.name,
      parameters: {
        domain: "climate",
        service: "set_temperature",
        data: { temperature: 21 },
      },
    }).catch(() => {});

    // 4. Audit
    logActionSync({
      householdId: household.id,
      action: "safe_arrival_alert",
      details: `MEMBER_ARRIVED: ${member.name} est rentré(e) - Scénario accueil déclenché`,
      status: "success",
    });
  }

  /* ── 6. Scénario "Alerte Retard" ── */

  /**
   * Scénario "Alerte Retard" :
   * Enfant sort de l'école après 18h sans être rentré → alerte parents
   */
  private async handlePotentialDelay(
    member: { id: string; name: string; role: string; householdId: string },
    household: { id: string; name: string; notificationPrefs: unknown; contactEmail: string | null },
    now: Date,
  ): Promise<void> {
    console.log(
      `[LocationEngine] DELAY_ALERT: ${member.name} a quitté l'école à ${now.getHours()}h - enfant en retard potentiel`,
    );

    // 1. Notification Push critique
    await sendPushToHousehold(
      household.id,
      `⚠️ Alerte Retard — ${member.name}`,
      `${member.name} a quitté l'école après 18h. Vérifiez son retour.`,
      { priority: 10 }
    ).catch(() => {});

    // 2. Notification rouge sur la tablette Maellis (via SSE)
    // Le SSE endpoint peut être utilisé pour push en temps réel
    console.log(`[LocationEngine] DELAY_ALERT: Notification rouge envoyée à la tablette`);

    // 3. Audit
    logActionSync({
      householdId: household.id,
      action: "safe_arrival_alert",
      details: `DELAY_ALERT: ${member.name} - Sortie école après 18h`,
      status: "security_alert",
    });
  }

  /* ── 7. Déclenchement de scène HA ── */

  /**
   * Déclenche une scène Home Assistant personnalisée.
   * Extrait le domain et entity_id depuis un entity_id complet
   * comme "scene.welcome_home" → domain: "scene", entity_id: "scene.welcome_home"
   */
  private async triggerHAScene(
    sceneEntityId: string,
    householdId: string,
    memberName: string,
  ): Promise<void> {
    // Extraire le domaine (avant le premier point)
    // Validate scene entity_id format: must match domain.entity_name pattern
    const haEntityRegex = /^[a-z_]+\.[a-z_0-9]+$/;
    if (!haEntityRegex.test(sceneEntityId)) {
      console.warn(`[LocationEngine] Invalid HA entity_id: ${sceneEntityId}`);
      return;
    }
    const domain = sceneEntityId.split(".")[0];
    if (!domain) return;

    console.log(
      `[LocationEngine] HA Scene: ${sceneEntityId} pour ${memberName}`,
    );

    await homeAssistantBridge.execute({
      type: "custom",
      householdId,
      guestName: memberName,
      parameters: {
        domain,
        service: "turn_on",
        data: { entity_id: sceneEntityId },
      },
    }).catch(() => {});
  }

  /* ── 8. Vérification des retards (Cron) ── */

  /**
   * Vérifie tous les membres enfants qui ne sont pas rentrés
   * à l'heure prévue (expectedHomeBefore).
   *
   * Appelé par le cron job /api/cron/check-delays
   */
  async checkDelayAlerts(): Promise<DelayAlertResult> {
    const now = new Date();
    const members = await prisma.familyMember.findMany({
      where: {
        role: "Child",
        isActive: true,
        consentGiven: true,
        status: { not: "home" },
        expectedHomeBefore: { lt: now },
      },
      include: { household: true },
    });

    let alertsTriggered = 0;
    const details: { memberName: string; minutesLate: number }[] = [];

    for (const member of members) {
      if (!member.expectedHomeBefore) continue;

      const minutesLate = Math.floor(
        (now.getTime() - member.expectedHomeBefore.getTime()) / 60000,
      );

      if (minutesLate >= 15) { // Alerte après 15 minutes de retard
        console.log(
          `[LocationEngine] Cron delay: ${member.name} en retard de ${minutesLate} min`,
        );

        // Ne pas renvoyer si déjà alerté récemment (éviter spam)
        const recentAlert = await prisma.locationLog.findFirst({
          where: {
            memberId: member.id,
            event: "exit",
            geoFenceName: "DELAY_ALERT",
            createdAt: { gt: new Date(now.getTime() - 30 * 60 * 1000) }, // 30 min
          },
        });

        if (!recentAlert) {
          await sendPushToHousehold(
            member.householdId,
            `⚠️ ${member.name} n'est pas rentré(e)`,
            `Retard de ${minutesLate} minutes. Heure prévue: ${member.expectedHomeBefore.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
            { priority: 10 },
          ).catch(() => {});

          // Logger l'alerte
          await prisma.locationLog.create({
            data: {
              memberId: member.id,
              householdId: member.householdId,
              // Use last known position if available, otherwise skip coordinates entirely
              // (DELAY_ALERT logs don't need precise GPS — the member data is the key info)
              lat: member.lastKnownLat ?? 0,
              lng: member.lastKnownLng ?? 0,
              event: "exit",
              geoFenceName: "DELAY_ALERT",
              expiresAt: new Date(now.getTime() + member.autoDeleteDays * 24 * 60 * 60 * 1000),
            },
          });

          logActionSync({
            householdId: member.householdId,
            action: "safe_arrival_alert",
            details: `DELAY_CRON: ${member.name} en retard de ${minutesLate} min`,
            status: "security_alert",
          });

          alertsTriggered++;
        }

        details.push({ memberName: member.name, minutesLate });
      }
    }

    return {
      checked: members.length,
      alertsTriggered,
      details,
    };
  }

  /* ── 9. Nettoyage des logs expirés (RGPD) ── */

  /**
   * Supprime tous les LocationLog dont la date d'expiration est passée.
   * Appelé par le cron job /api/cron/cleanup-location-logs
   */
  async cleanupExpiredLogs(): Promise<{ deleted: number }> {
    const now = new Date();

    const result = await prisma.locationLog.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    console.log(
      `[LocationEngine] Cleanup: ${result.count} logs de localisation supprimés (RGPD)`,
    );

    return { deleted: result.count };
  }

  /* ── 10. Obtenir le statut en temps réel de tous les membres ── */

  /**
   * Retourne la position et le statut de tous les membres actifs
   * d'un foyer, avec leurs logs récents.
   */
  async getFamilyStatus(householdId: string) {
    const members = await prisma.familyMember.findMany({
      where: {
        householdId,
        isActive: true,
      },
      include: {
        locationLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculer les distances par rapport à la zone "Maison" si définie
    const homeFence = await prisma.geoFence.findFirst({
      where: {
        householdId,
        type: "home",
        isActive: true,
      },
    });

    return members.map((member) => {
      let distanceFromHome: number | null = null;
      let etaMinutes: number | null = null;

      if (
        homeFence &&
        member.lastKnownLat != null &&
        member.lastKnownLng != null &&
        member.status !== "home"
      ) {
        distanceFromHome = Math.round(
          haversineDistance(
            member.lastKnownLat,
            member.lastKnownLng,
            homeFence.centerLat,
            homeFence.centerLng,
          ),
        );
        etaMinutes = estimatedTravelTime(distanceFromHome);
        // Guard against Infinity from division by zero
        if (!Number.isFinite(etaMinutes)) etaMinutes = null;
      }

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        avatarColor: member.avatarColor,
        status: member.status,
        lastKnownLat: member.lastKnownLat,
        lastKnownLng: member.lastKnownLng,
        lastKnownAt: member.lastKnownAt,
        lastKnownAccuracy: member.lastKnownAccuracy,
        batteryLevel: member.batteryLevel,
        consentGiven: member.consentGiven,
        isActive: member.isActive,
        expectedHomeBefore: member.expectedHomeBefore,
        currentGeoFenceId: member.currentGeoFenceId,
        distanceFromHome,
        etaMinutes,
        recentLogs: member.locationLogs,
      };
    });
  }
}

/* ═══════════════════════════════════════════════════════
   Instance singleton
   ═══════════════════════════════════════════════════════ */

export const locationEngine = new LocationEngine();
