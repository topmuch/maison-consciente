/* ═══════════════════════════════════════════════════════
   MAELLIS — Pont Home Assistant

   Connecteur vers Home Assistant pour exécuter des
   scènes et commandes domotiques lors des automations
   calendaires (arrivée, départ, late checkout).

   Configuration : table ApiConfig avec serviceKey
   "HOME_ASSISTANT" — apiKey contient l'URL de
   l'instance HA, apiSecret (optionnel) le token
   d'accès longue durée.
   ═══════════════════════════════════════════════════════ */

import { db } from "@/core/db";
import { decryptSecret } from "@/lib/aes-crypto";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface HACredential {
  url: string;      // URL de base Home Assistant (ex: http://homeassistant.local:8123)
  token?: string;   // Token d'accès longue durée (optionnel sur réseau local)
}

export interface AutomationCommand {
  type: "welcome_scenario" | "checkout_script" | "late_checkout" | "custom";
  householdId: string;
  guestName: string;
  parameters?: Record<string, unknown>;
}

interface HAResponse {
  success: boolean;
  message: string;
}

/* ═══════════════════════════════════════════════════════
   HomeAssistantBridge
   ═══════════════════════════════════════════════════════ */

export class HomeAssistantBridge {
  /** Cache en mémoire des identifiants HA */
  private credentialsCache: HACredential | null = null;
  private credentialsFetchedAt: number = 0;
  private static readonly CACHE_TTL_MS = 300_000; // 5 min

  /* ── Configuration ── */

  /**
   * Charge les identifiants Home Assistant depuis la table ApiConfig.
   * Utilise un cache en mémoire pour éviter des lectures DB répétées.
   */
  private async getCredentials(): Promise<HACredential | null> {
    const now = Date.now();

    // Retourner le cache s'il est encore valide
    if (this.credentialsCache && (now - this.credentialsFetchedAt) < HomeAssistantBridge.CACHE_TTL_MS) {
      return this.credentialsCache;
    }

    try {
      const config = await db.apiConfig.findUnique({
        where: { serviceKey: "HOME_ASSISTANT" },
      });

      if (!config || !config.isActive) {
        console.warn("[HA Bridge] Home Assistant non configuré ou désactivé dans ApiConfig");
        return null;
      }

      // L'URL HA est stockée dans apiKey (chiffré), le token dans baseUrl (chiffré)
      const haUrl = decryptSecret(config.apiKey);
      if (!haUrl) {
        console.warn("[HA Bridge] Impossible de déchiffrer l'URL Home Assistant");
        return null;
      }

      // Nettoyage de l'URL (supprimer le slash final)
      const cleanedUrl = haUrl.replace(/\/+$/, "");

      // Le token est optionnel — stocké dans baseUrl s'il est fourni
      let token: string | undefined;
      if (config.baseUrl) {
        const decrypted = decryptSecret(config.baseUrl);
        if (decrypted) {
          token = decrypted;
        }
      }

      this.credentialsCache = { url: cleanedUrl, token };
      this.credentialsFetchedAt = now;

      console.log(`[HA Bridge] Identifiants chargés pour ${cleanedUrl}`);
      return this.credentialsCache;
    } catch (err) {
      console.error("[HA Bridge] Erreur lors du chargement des identifiants :", err);
      return null;
    }
  }

  /**
   * Invalide le cache des identifiants (utile après modification en admin).
   */
  invalidateCache(): void {
    this.credentialsCache = null;
    this.credentialsFetchedAt = 0;
  }

  /* ── Appels HTTP vers Home Assistant ── */

  /**
   * Exécute un appel HTTP POST vers l'API REST de Home Assistant.
   * Tous les appels sont enveloppés dans un try/catch pour ne jamais
   * planter le moteur d'automatisation.
   */
  private async callHA(
    domain: string,
    service: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    const creds = await this.getCredentials();
    if (!creds) {
      return false;
    }

    const endpoint = `${creds.url}/api/services/${domain}/${service}`;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Ajouter le token d'autorisation si disponible
      if (creds.token) {
        headers["Authorization"] = `Bearer ${creds.token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `[HA Bridge] Appel ${domain}.${service} a retourné ${response.status} ${response.statusText}`,
        );
        return false;
      }

      console.log(`[HA Bridge] ✓ ${domain}.${service} exécuté avec succès`);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.warn(`[HA Bridge] Timeout lors de l'appel ${domain}.${service}`);
      } else {
        console.error(`[HA Bridge] Erreur lors de l'appel ${domain}.${service} :`, err);
      }
      return false;
    }
  }

  /* ═══════════════════════════════════════════════════════
     Scénarios d'automatisation
     ═══════════════════════════════════════════════════════ */

  /**
   * Scénario d'accueil — activé à l'arrivée du client.
   *
   * Tente d'abord d'activer la scène "scene.welcome_guest".
   * En cas d'échec, exécute les commandes individuelles :
   *   - Allumer les lumières
   *   - Régler le thermostat à 21°C
   *   - Lancer une playlist relaxante
   */
  async triggerWelcomeScenario(
    householdId: string,
    guestName: string,
  ): Promise<boolean> {
    console.log(`[HA Bridge] Scénario d'accueil pour ${guestName} (ménage: ${householdId})`);

    // ── 1. Essayer la scène dédiée ──
    const sceneOk = await this.callHA("scene", "turn_on", {
      entity_id: "scene.welcome_guest",
    });

    if (sceneOk) {
      console.log(`[HA Bridge] Scène welcome_guest activée pour ${guestName}`);
      return true;
    }

    console.log(`[HA Bridge] Scène welcome_guest introuvable — exécution des commandes individuelles`);

    // ── 2. Commandes individuelles (fallback) ──
    let allOk = true;

    // Allumer les lumières
    const lightsOk = await this.callHA("homeassistant", "turn_on", {
      entity_id: "group.all_lights",
    });
    if (!lightsOk) allOk = false;

    // Régler le thermostat à 21°C
    const thermostatOk = await this.callHA("climate", "set_temperature", {
      temperature: 21,
    });
    if (!thermostatOk) allOk = false;

    // Lancer une musique relaxante
    const musicOk = await this.callHA("media_player", "play_media", {
      media_content_type: "playlist",
      media_content_id: "relaxation",
    });
    if (!musicOk) allOk = false;

    console.log(
      `[HA Bridge] Commandes d'accueil terminées — ${allOk ? "succès" : "partiel"}`,
    );
    return allOk;
  }

  /**
   * Script de départ — activé au checkout du client.
   *
   * Actions :
   *   - Thermostat en mode éco (18°C)
   *   - Extinction des zones réservées aux clients
   */
  async triggerCheckoutScript(
    householdId: string,
    guestName: string,
  ): Promise<boolean> {
    console.log(`[HA Bridge] Script de départ pour ${guestName} (ménage: ${householdId})`);

    let allOk = true;

    // ── 1. Thermostat en mode éco ──
    const ecoOk = await this.callHA("climate", "set_temperature", {
      temperature: 18,
    });
    if (!ecoOk) allOk = false;

    // ── 2. Extinction des zones client ──
    // Liste typique des entités de zone client
    const guestZones = [
      "group.guest_lights",
      "group.guest_media",
      "group.guest_climate",
    ];

    for (const zone of guestZones) {
      const zoneOk = await this.callHA("homeassistant", "turn_off", {
        entity_id: zone,
      });
      if (!zoneOk) allOk = false;
    }

    console.log(
      `[HA Bridge] Script de départ terminé pour ${guestName} — ${allOk ? "succès" : "partiel"}`,
    );
    return allOk;
  }

  /**
   * Offre de late checkout — notification envoyée à l'hôte.
   *
   * Envoie une notification via le service notify.host de HA
   * pour informer qu'un late checkout est possible.
   */
  async triggerLateCheckoutOffer(
    householdId: string,
    guestName: string,
  ): Promise<boolean> {
    console.log(
      `[HA Bridge] Notification late checkout pour ${guestName} (ménage: ${householdId})`,
    );

    const message =
      `🏠 Possibilité de late checkout — ${guestName} pourrait bénéficier ` +
      `d'un départ tardif. Aucune réservation suivante aujourd'hui.`;

    const ok = await this.callHA("notify", "host", {
      title: "Late Checkout Disponible",
      message,
    });

    if (!ok) {
      console.warn(`[HA Bridge] Impossible d'envoyer la notification late checkout`);
    }

    return ok;
  }

  /* ═══════════════════════════════════════════════════════
     Routeur de commandes génériques
     ═══════════════════════════════════════════════════════ */

  /**
   * Exécute une commande d'automatisation générique.
   * Route vers la méthode appropriée selon le type.
   *
   * @returns Un objet avec le statut et un message descriptif
   */
  async execute(command: AutomationCommand): Promise<HAResponse> {
    // Vérifier que HA est configuré (silent skip)
    const creds = await this.getCredentials();
    if (!creds) {
      console.warn(
        `[HA Bridge] Home Assistant non configuré — commande "${command.type}" ignorée pour ${command.guestName}`,
      );
      return {
        success: false,
        message: "Home Assistant non configuré",
      };
    }

    switch (command.type) {
      case "welcome_scenario": {
        const ok = await this.triggerWelcomeScenario(
          command.householdId,
          command.guestName,
        );
        return {
          success: ok,
          message: ok
            ? `Scénario d'accueil activé pour ${command.guestName}`
            : `Échec partiel du scénario d'accueil pour ${command.guestName}`,
        };
      }

      case "checkout_script": {
        const ok = await this.triggerCheckoutScript(
          command.householdId,
          command.guestName,
        );
        return {
          success: ok,
          message: ok
            ? `Script de départ exécuté pour ${command.guestName}`
            : `Échec partiel du script de départ pour ${command.guestName}`,
        };
      }

      case "late_checkout": {
        const ok = await this.triggerLateCheckoutOffer(
          command.householdId,
          command.guestName,
        );
        return {
          success: ok,
          message: ok
            ? `Notification late checkout envoyée pour ${command.guestName}`
            : `Impossible d'envoyer la notification late checkout`,
        };
      }

      case "custom": {
        // Commande personnalisée : utilise les paramètres fournis
        const domain = command.parameters?.domain as string | undefined;
        const service = command.parameters?.service as string | undefined;
        const data = (command.parameters?.data as Record<string, unknown>) ?? {};

        if (!domain || !service) {
          console.warn("[HA Bridge] Commande custom sans domain/service");
          return {
            success: false,
            message: "Commande custom : domain et service requis",
          };
        }

        const ok = await this.callHA(domain, service, data);
        return {
          success: ok,
          message: ok
            ? `Commande custom ${domain}.${service} exécutée`
            : `Échec de la commande custom ${domain}.${service}`,
        };
      }

      default: {
        console.warn(`[HA Bridge] Type de commande inconnu : ${command.type}`);
        return {
          success: false,
          message: `Type de commande inconnu : ${command.type}`,
        };
      }
    }
  }

  /* ═══════════════════════════════════════════════════════
     Diagnostic
     ═══════════════════════════════════════════════════════ */

  /**
   * Vérifie la connexion à Home Assistant en appelant l'endpoint /api/.
   * Retourne true si HA est joignable et répond correctement.
   */
  async healthCheck(): Promise<boolean> {
    const creds = await this.getCredentials();
    if (!creds) {
      return false;
    }

    try {
      const headers: Record<string, string> = {};
      if (creds.token) {
        headers["Authorization"] = `Bearer ${creds.token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000);

      const response = await fetch(`${creds.url}/api/`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isOk = response.ok;
      console.log(
        `[HA Bridge] Diagnostic — ${creds.url} : ${isOk ? "✓ joignable" : "✗ erreur " + response.status}`,
      );
      return isOk;
    } catch (err) {
      console.error("[HA Bridge] Diagnostic — Home Assistant injoignable :", err);
      return false;
    }
  }
}

/* ═══════════════════════════════════════════════════════
   Instance singleton
   ═══════════════════════════════════════════════════════ */

export const homeAssistantBridge = new HomeAssistantBridge();
