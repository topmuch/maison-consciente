// ═══════════════════════════════════════════════════════════════
// MAISON CONSCIENTE — Email Notification Service
//
// Comprehensive email service providing 16 notification functions
// organized into 4 categories:
//   - Sécurité & Safe Arrival (4)
//   - Facturation & Abonnement (4)
//   - Hospitality (4)
//   - Compte & Admin (4)
//
// Each function is self-contained, handles errors gracefully,
// and never throws. Uses the Maison Consciente brand templates.
// ═══════════════════════════════════════════════════════════════

import { sendMail, isEmailConfigured as isEmailConfiguredAsync } from "@/lib/smtp-client";

/** Legacy sync wrapper for backward compatibility */
function isEmailConfigured(): boolean {
  // Check env vars synchronously as a quick pre-check
  const host = process.env.SMTP_HOST || "";
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM_EMAIL || "";
  return !!(host && user && pass && from);
}
import {
  generateEmailTemplate,
  alertContent,
  infoContent,
  ctaContent,
  listContent,
} from "@/lib/email-template";

/* ═══════════════════════════════════════════════════════════════
   SÉCURITÉ & SAFE ARRIVAL (4)
   ═══════════════════════════════════════════════════════════════ */

/**
 * 1. Send an urgent alert when a child is late arriving home.
 * Uses alertContent with red urgent styling.
 */
export async function sendChildLateAlert(
  parentEmail: string,
  params: {
    childName: string;
    expectedTime: string;
    lateMinutes: number;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const severity =
      params.lateMinutes >= 30
        ? "URGENCE — Retard critique"
        : "ATTENTION — Retard de trajet";

    const content = alertContent(
      `${params.childName} n'est pas rentré(e) à l'heure prévue`,
      `${params.childName} devait arriver à <strong>${params.expectedTime}</strong> mais n'est toujours pas rentré(e) après <strong>${params.lateMinutes} minutes</strong> de retard.`,
      [
        params.lateMinutes >= 30
          ? "Un appel d'urgence est recommandé immédiatement."
          : "Veuillez vérifier si votre enfant a été retenu à l'école ou par une activité imprévue.",
        `Heure d'arrivée prévue : ${params.expectedTime}`,
        `Retard constaté : ${params.lateMinutes} minutes`,
      ]
    );

    const html = generateEmailTemplate({
      subject: `${severity} — ${params.childName}`,
      preheader: `${params.childName} est en retard de ${params.lateMinutes} minutes.`,
      content,
      footerText:
        "Cette alerte a été générée automatiquement par le système Safe Arrival de Maison Consciente. Vérifiez immédiatement la situation de votre enfant.",
    });

    await sendMail({
      to: parentEmail,
      subject: `${severity} — ${params.childName}`,
      html,
      priority: "high",
      headers: { "X-MC-Alert": "child-late", "X-MC-Priority": "urgent" },
    });
  } catch (err) {
    console.error("[EmailService] sendChildLateAlert error:", err);
  }
}

/**
 * 2. Send a reassuring confirmation when all family members have arrived safely.
 * Uses infoContent with green confirmation styling.
 */
export async function sendFamilySafeConfirmation(
  email: string,
  params: {
    members: string[];
    date: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const membersList = params.members
      .map((name) => `✓ ${name}`)
      .join("<br>");

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="background-color:#f0fdf4;border-left:4px solid #16a34a;padding:20px 24px;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 8px 0;color:#16a34a;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              ✓ Tout le monde est rentré
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Famille en sécurité
            </h2>
            <p style="margin:0 0 16px 0;color:#1a1a2e;font-size:15px;line-height:1.6;">
              Tous les membres de votre foyer sont arrivés sains et saufs le <strong>${params.date}</strong>.
            </p>
            <p style="margin:0;color:#1a1a2e;font-size:15px;line-height:1.8;">
              ${membersList}
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: "✓ Famille en sécurité — Tous les membres sont rentrés",
      preheader: `Confirmation : ${params.members.length} membre(s) en sécurité.`,
      content,
    });

    await sendMail({
      to: email,
      subject: "✓ Famille en sécurité — Tous les membres sont rentrés",
      html,
      priority: "low",
      headers: { "X-MC-Alert": "family-safe" },
    });
  } catch (err) {
    console.error("[EmailService] sendFamilySafeConfirmation error:", err);
  }
}

/**
 * 3. Send a pre-critical warning when a parent has not been seen for an extended period.
 * Uses alertContent with warning styling.
 */
export async function sendParentMissingAlert(
  email: string,
  params: {
    parentName: string;
    lastSeenTime: string;
    hoursMissing: number;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="background-color:#fff7ed;border-left:4px solid #ea580c;padding:20px 24px;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 8px 0;color:#ea580c;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              ⚠ Alerte pré-critique
            </p>
            <h2 style="margin:0 0 10px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              ${params.parentName} n'a pas été vu(e) depuis ${params.hoursMissing}h
            </h2>
            <p style="margin:0 0 4px 0;color:#1a1a2e;font-size:15px;line-height:1.6;">
              La dernière activité enregistrée pour <strong>${params.parentName}</strong> remonte à <strong>${params.lastSeenTime}</strong>, soit il y a <strong>${params.hoursMissing} heures</strong>.
            </p>
            <ul style="margin:16px 0 0 0;padding:0 0 0 20px;color:#1a1a2e;font-size:15px;line-height:1.6;">
              <li style="margin-bottom:6px;">Essayez de contacter ${params.parentName} directement</li>
              <li style="margin-bottom:6px;">Vérifiez les lieux habituels fréquentés</li>
              <li style="margin-bottom:6px;">Si vous n'avez pas de nouvelles dans l'heure, contactez les autorités</li>
            </ul>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: `⚠ Alerte pré-critique — ${params.parentName} introuvable`,
      preheader: `${params.parentName} n'a pas été vu(e) depuis ${params.hoursMissing} heures.`,
      content,
      footerText:
        "Cette alerte a été déclenchée automatiquement. Vous pouvez configurer le seuil de déclenchement dans les paramètres de Safe Arrival.",
    });

    await sendMail({
      to: email,
      subject: `⚠ Alerte pré-critique — ${params.parentName} introuvable`,
      html,
      priority: "high",
      headers: { "X-MC-Alert": "parent-missing" },
    });
  } catch (err) {
    console.error("[EmailService] sendParentMissingAlert error:", err);
  }
}

/**
 * 4. Send a confirmation after an SOS emergency alert has been processed.
 * Uses alertContent with emergency confirmation styling.
 */
export async function sendSOSConfirmation(
  email: string,
  params: {
    alertType: string;
    timestamp: string;
    contactsNotified: string[];
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const contactsList = params.contactsNotified
      .map((contact) => `• ${contact}`)
      .join("<br>");

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:20px 24px;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 8px 0;color:#dc2626;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
              🚨 Confirmation SOS
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Alerte ${params.alertType} — Confirmée
            </h2>
            <p style="margin:0 0 12px 0;color:#1a1a2e;font-size:15px;line-height:1.6;">
              Votre alerte d'urgence a bien été transmise le <strong>${params.timestamp}</strong>.
            </p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
              Contacts notifiés :
            </p>
            <p style="margin:0 0 16px 0;color:#1a1a2e;font-size:15px;line-height:1.8;">
              ${contactsList}
            </p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
              Si cette alerte a été déclenchée par erreur, veuillez annuler l'alerte depuis votre tableau de bord ou contacter le support.
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: `🚨 SOS Confirmé — ${params.alertType}`,
      preheader: `Alerte ${params.alertType} transmise à ${params.contactsNotified.length} contact(s).`,
      content,
      footerText:
        "Restez calme et suivez les consignes de sécurité. Les contacts d'urgence ont été notifiés automatiquement.",
    });

    await sendMail({
      to: email,
      subject: `🚨 SOS Confirmé — ${params.alertType}`,
      html,
      priority: "high",
      headers: { "X-MC-Alert": "sos-confirmation" },
    });
  } catch (err) {
    console.error("[EmailService] sendSOSConfirmation error:", err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   FACTURATION & ABONNEMENT (4)
   ═══════════════════════════════════════════════════════════════ */

/**
 * 5. Send an invoice email with a CTA to download/view the invoice.
 * Uses ctaContent with action button.
 */
export async function sendInvoiceEmail(
  email: string,
  params: {
    userName: string;
    invoiceUrl: string;
    amount: string;
    period: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 20px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.userName},
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Votre facture est disponible
            </h2>
            <p style="margin:0 0 8px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Votre facture pour la période <strong>${params.period}</strong> d'un montant de <strong>${params.amount}</strong> est prête.
            </p>
            ${listContent([
              { label: "Montant", value: params.amount },
              { label: "Période", value: params.period },
              { label: "Statut", value: "À payer" },
            ])}
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: `Votre facture — ${params.period} | ${params.amount}`,
      preheader: `Facture ${params.period} : ${params.amount}. Téléchargez-la maintenant.`,
      content,
      ctaUrl: params.invoiceUrl,
      ctaText: "Télécharger la facture",
      footerText:
        "Pour toute question concernant votre facture, n'hésitez pas à contacter notre support.",
    });

    await sendMail({
      to: email,
      subject: `Votre facture — ${params.period} | ${params.amount}`,
      html,
      priority: "normal",
      headers: { "X-MC-Type": "invoice" },
    });
  } catch (err) {
    console.error("[EmailService] sendInvoiceEmail error:", err);
  }
}

/**
 * 6. Send an urgent alert when a payment has failed.
 * Uses alertContent with urgent billing styling.
 */
export async function sendPaymentFailedAlert(
  email: string,
  params: {
    userName: string;
    amount: string;
    reason: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 20px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.userName},
            </p>
            ${alertContent(
              "Échec de votre paiement",
              `Le prélèvement de <strong>${params.amount}</strong> sur votre compte n'a pas pu aboutir. Raison : ${params.reason}.`,
              [
                "Mettez à jour vos informations de paiement dès que possible.",
                "Votre accès reste actif pendant 7 jours.",
                "Après ce délai, certaines fonctionnalités pourraient être limitées.",
              ]
            )}
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: "⚠ Échec de paiement — Action requise",
      preheader: `Le paiement de ${params.amount} a échoué. Mettez à jour votre carte.`,
      content,
      ctaUrl: "/dashboard/billing",
      ctaText: "Mettre à jour ma carte",
      footerText:
        "Si vous pensez qu'il s'agit d'une erreur, veuillez vérifier les informations de votre carte ou contacter votre banque.",
    });

    await sendMail({
      to: email,
      subject: "⚠ Échec de paiement — Action requise",
      html,
      priority: "high",
      headers: { "X-MC-Type": "payment-failed", "X-MC-Priority": "urgent" },
    });
  } catch (err) {
    console.error("[EmailService] sendPaymentFailedAlert error:", err);
  }
}

/**
 * 7. Send a confirmation email when a subscription plan has been changed.
 * Uses infoContent with confirmation styling.
 */
export async function sendSubscriptionChangedEmail(
  email: string,
  params: {
    userName: string;
    newPlan: string;
    effectiveDate: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 20px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.userName},
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="background-color:#f0fdf4;border-left:4px solid #16a34a;padding:20px 24px;border-radius:0 8px 8px 0;">
                  <p style="margin:0 0 8px 0;color:#16a34a;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                    ✓ Changement confirmé
                  </p>
                  <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
                    Votre abonnement a été mis à jour
                  </h2>
                  <p style="margin:0 0 12px 0;color:#1a1a2e;font-size:15px;line-height:1.6;">
                    Votre abonnement est passé au forfait <strong>${params.newPlan}</strong>, applicable à compter du <strong>${params.effectiveDate}</strong>.
                  </p>
                  ${listContent([
                    { label: "Nouveau forfait", value: params.newPlan },
                    { label: "Date d'effet", value: params.effectiveDate },
                    { label: "Statut", value: "Actif" },
                  ])}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: `Abonnement mis à jour — ${params.newPlan}`,
      preheader: `Votre forfait est maintenant ${params.newPlan} depuis le ${params.effectiveDate}.`,
      content,
      ctaUrl: "/dashboard/billing",
      ctaText: "Voir mon abonnement",
    });

    await sendMail({
      to: email,
      subject: `Abonnement mis à jour — ${params.newPlan}`,
      html,
      priority: "normal",
      headers: { "X-MC-Type": "subscription-changed" },
    });
  } catch (err) {
    console.error("[EmailService] sendSubscriptionChangedEmail error:", err);
  }
}

/**
 * 8. Send a reminder that a free trial is ending soon.
 * Uses ctaContent with upgrade prompt.
 */
export async function sendTrialEndingReminder(
  email: string,
  params: {
    userName: string;
    daysLeft: number;
    currentFeatures: string[];
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const featuresList = params.currentFeatures
      .map((feature) => `<li style="margin-bottom:6px;">${feature}</li>`)
      .join("");

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 20px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.userName},
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Votre période d'essai se termine dans ${params.daysLeft} jour${params.daysLeft > 1 ? "s" : ""}
            </h2>
            <p style="margin:0 0 16px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Profitez encore de vos fonctionnalités actuelles :
            </p>
            <ul style="margin:0 0 20px 0;padding:0 0 0 20px;color:#1a1a2e;font-size:15px;line-height:1.8;">
              ${featuresList}
            </ul>
            <p style="margin:0 0 4px 0;color:#64748b;font-size:14px;line-height:1.6;">
              Choisissez un forfait pour continuer à profiter de toutes les fonctionnalités de Maison Consciente après la fin de l'essai.
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: `Votre essai se termine dans ${params.daysLeft} jour${params.daysLeft > 1 ? "s" : ""}`,
      preheader: `Plus que ${params.daysLeft} jour${params.daysLeft > 1 ? "s" : ""} avant la fin de votre essai gratuit.`,
      content,
      ctaUrl: "/dashboard/billing/plans",
      ctaText: "Choisir un forfait",
      footerText:
        "En l'absence d'abonnement, votre accès sera limité à la version gratuite après la période d'essai.",
    });

    await sendMail({
      to: email,
      subject: `Votre essai se termine dans ${params.daysLeft} jour${params.daysLeft > 1 ? "s" : ""}`,
      html,
      priority: "normal",
      headers: { "X-MC-Type": "trial-ending" },
    });
  } catch (err) {
    console.error("[EmailService] sendTrialEndingReminder error:", err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   HOSPITALITY (4)
   ═══════════════════════════════════════════════════════════════ */

/**
 * 9. Send a warm welcome email to a guest with property details and access info.
 * Uses infoContent with warm hospitality styling.
 */
export async function sendWelcomeGuestEmail(
  email: string,
  params: {
    guestName: string;
    propertyName: string;
    accessCodes: string;
    checkInTime: string;
    wifiPassword: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.guestName},
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Bienvenue au ${params.propertyName}
            </h2>
            <p style="margin:0 0 24px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Nous sommes ravis de vous accueillir ! Voici toutes les informations dont vous aurez besoin pour votre séjour.
            </p>
            ${listContent([
              { label: "🔑 Code d'accès", value: params.accessCodes },
              { label: "🕐 Arrivée", value: params.checkInTime },
              { label: "📶 Wi-Fi", value: `Maison Consciente — ${params.wifiPassword}` },
            ])}
            <p style="margin:24px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;">
              Notre équipe est à votre disposition 24h/24. N'hésitez pas à nous contacter pour toute demande.
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: `Bienvenue au ${params.propertyName}`,
      preheader: `Vos informations d'accès pour ${params.propertyName}.`,
      content,
      ctaUrl: "/contact",
      ctaText: "Contacter la réception",
      footerText:
        "Nous vous souhaitons un excellent séjour au cœur de la conscience et du bien-être.",
    });

    await sendMail({
      to: email,
      subject: `Bienvenue au ${params.propertyName}`,
      html,
      priority: "normal",
      headers: { "X-MC-Type": "guest-welcome" },
    });
  } catch (err) {
    console.error("[EmailService] sendWelcomeGuestEmail error:", err);
  }
}

/**
 * 10. Send a check-out reminder to a departing guest.
 * Uses infoContent with departure instructions styling.
 */
export async function sendCheckOutReminderEmail(
  email: string,
  params: {
    guestName: string;
    checkOutTime: string;
    instructions: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.guestName},
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Rappel de départ
            </h2>
            <p style="margin:0 0 8px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Nous espérons que vous avez passé un merveilleux séjour. N'oubliez pas que votre départ est prévu à <strong>${params.checkOutTime}</strong>.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0 0 8px 0;color:#1a1a2e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                    Instructions de départ
                  </p>
                  <p style="margin:0;color:#1a1a2e;font-size:14px;line-height:1.7;">
                    ${params.instructions}
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:16px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;">
              Merci de votre confiance et à très bientôt !
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: "Rappel de départ — Nous espérons vous revoir bientôt",
      preheader: `Votre départ est prévu à ${params.checkOutTime}.`,
      content,
    });

    await sendMail({
      to: email,
      subject: "Rappel de départ — Nous espérons vous revoir bientôt",
      html,
      priority: "normal",
      headers: { "X-MC-Type": "checkout-reminder" },
    });
  } catch (err) {
    console.error("[EmailService] sendCheckOutReminderEmail error:", err);
  }
}

/**
 * 11. Send a notification when a support ticket receives a new reply.
 * Uses infoContent with support notification styling.
 */
export async function sendSupportTicketReplyEmail(
  email: string,
  params: {
    ticketId: string;
    message: string;
    senderRole: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const roleLabel =
      params.senderRole === "agent"
        ? "Un membre de notre équipe"
        : params.senderRole === "system"
          ? "Le système"
          : params.senderRole;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 20px 0;color:#64748b;font-size:14px;line-height:1.5;">
              ${roleLabel} a répondu à votre ticket.
            </p>
            <h2 style="margin:0 0 16px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Nouvelle réponse — Ticket #${params.ticketId}
            </h2>
            ${listContent([
              { label: "Ticket", value: `#${params.ticketId}` },
              { label: "Réponse de", value: roleLabel },
            ])}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;border-radius:8px;margin:16px 0;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0;color:#1a1a2e;font-size:15px;line-height:1.7;">
                    ${params.message}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: `Réponse au ticket #${params.ticketId}`,
      preheader: `${roleLabel} a répondu à votre ticket #${params.ticketId}.`,
      content,
      ctaUrl: `/support/tickets/${params.ticketId}`,
      ctaText: "Voir la conversation",
    });

    await sendMail({
      to: email,
      subject: `Réponse au ticket #${params.ticketId}`,
      html,
      priority: "normal",
      headers: { "X-MC-Type": "support-reply" },
    });
  } catch (err) {
    console.error("[EmailService] sendSupportTicketReplyEmail error:", err);
  }
}

/**
 * 12. Send a post-stay summary email with a review request.
 * Uses ctaContent with review prompt styling.
 */
export async function sendStaySummaryEmail(
  email: string,
  params: {
    guestName: string;
    propertyName: string;
    stayDuration: string;
    reviewLink: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.guestName},
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Merci pour votre séjour au ${params.propertyName}
            </h2>
            <p style="margin:0 0 16px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Nous espérons que vous avez apprécié vos <strong>${params.stayDuration}</strong> au sein de notre propriété. Votre confort et votre bien-être sont au cœur de notre engagement.
            </p>
            <p style="margin:0 0 24px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Votre avis compte énormément pour nous. Prenez quelques instants pour partager votre expérience — cela nous aide à améliorer continuellement notre service.
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: `Votre séjour au ${params.propertyName} — Partagez votre avis`,
      preheader: `Comment s'est passé votre séjour de ${params.stayDuration} ?`,
      content,
      ctaUrl: params.reviewLink,
      ctaText: "Laisser un avis",
      footerText:
        "Nous serions ravis de vous accueillir à nouveau. Consultez nos offres spéciales pour vos prochaines vacances.",
    });

    await sendMail({
      to: email,
      subject: `Votre séjour au ${params.propertyName} — Partagez votre avis`,
      html,
      priority: "low",
      headers: { "X-MC-Type": "stay-review" },
    });
  } catch (err) {
    console.error("[EmailService] sendStaySummaryEmail error:", err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   COMPTE & ADMIN (4)
   ═══════════════════════════════════════════════════════════════ */

/**
 * 13. Send a welcome email to a new user with a link to their dashboard.
 * Uses ctaContent with warm welcome styling.
 */
export async function sendWelcomeEmail(
  email: string,
  params: {
    userName: string;
    dashboardUrl: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bienvenue ${params.userName},
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Bienvenue dans la Maison Consciente
            </h2>
            <p style="margin:0 0 8px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Merci de nous rejoindre ! Votre maison intelligente est prête à vous accompagner au quotidien.
            </p>
            <p style="margin:0 0 8px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Avec Maison Consciente, vous bénéficiez d'un écosystème complet pour gérer votre foyer en toute sérénité :
            </p>
            <ul style="margin:8px 0 0 0;padding:0 0 0 20px;color:#1a1a2e;font-size:15px;line-height:1.8;">
              <li>Sécurité avancée et Safe Arrival</li>
              <li>Commandes vocales et automatisation</li>
              <li>Suivi de consommation et bien-être</li>
              <li>Hospitalité intelligente pour vos invités</li>
            </ul>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: "Bienvenue dans la Maison Consciente",
      preheader: `${params.userName}, découvrez votre tableau de bord.`,
      content,
      ctaUrl: params.dashboardUrl,
      ctaText: "Accéder à mon tableau de bord",
    });

    await sendMail({
      to: email,
      subject: "Bienvenue dans la Maison Consciente",
      html,
      priority: "normal",
      headers: { "X-MC-Type": "welcome" },
    });
  } catch (err) {
    console.error("[EmailService] sendWelcomeEmail error:", err);
  }
}

/**
 * 14. Send a password reset email with a time-limited reset link.
 * Uses ctaContent with security-focused styling.
 */
export async function sendPasswordResetEmail(
  email: string,
  params: {
    userName: string;
    resetLink: string;
    expiresAt: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.userName},
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Réinitialisation de votre mot de passe
            </h2>
            <p style="margin:0 0 12px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau.
            </p>
            ${listContent([
              { label: "Demandé par", value: params.userName },
              { label: "Expire le", value: params.expiresAt },
            ])}
            <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;line-height:1.5;">
              Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email — votre mot de passe restera inchangé.
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: "Réinitialisation de votre mot de passe",
      preheader: `Lien valable jusqu'au ${params.expiresAt}.`,
      content,
      ctaUrl: params.resetLink,
      ctaText: "Réinitialiser mon mot de passe",
      footerText:
        "Ce lien est valable pour une durée limitée. Pour des raisons de sécurité, ne le partagez avec personne.",
    });

    await sendMail({
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html,
      priority: "normal",
      headers: { "X-MC-Type": "password-reset" },
    });
  } catch (err) {
    console.error("[EmailService] sendPasswordResetEmail error:", err);
  }
}

/**
 * 15. Send a security alert for suspicious login activity.
 * Uses alertContent with security warning styling.
 */
export async function sendSecurityAlertEmail(
  email: string,
  params: {
    userName: string;
    location: string;
    device: string;
    timestamp: string;
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 20px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.userName},
            </p>
            ${alertContent(
              "Connexion suspecte détectée",
              `Une nouvelle connexion à votre compte a été identifiée depuis un appareil ou un lieu inhabituel.`,
              [
                `📍 Localisation : ${params.location}`,
                `📱 Appareil : ${params.device}`,
                `🕐 Date et heure : ${params.timestamp}`,
              ]
            )}
            <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;line-height:1.5;">
              Si c'est vous, vous pouvez ignorer cet email. Si ce n'est pas le cas, nous vous recommandons de modifier votre mot de passe immédiatement et d'activer l'authentification à deux facteurs.
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: "⚠ Connexion suspecte — Vérifiez votre compte",
      preheader: `Connexion détectée depuis ${params.location} le ${params.timestamp}.`,
      content,
      ctaUrl: "/dashboard/security",
      ctaText: "Sécuriser mon compte",
      footerText:
        "Protégez votre compte en activant l'authentification à deux facteurs dans les paramètres de sécurité.",
    });

    await sendMail({
      to: email,
      subject: "⚠ Connexion suspecte — Vérifiez votre compte",
      html,
      priority: "high",
      headers: { "X-MC-Type": "security-alert", "X-MC-Priority": "high" },
    });
  } catch (err) {
    console.error("[EmailService] sendSecurityAlertEmail error:", err);
  }
}

/**
 * 16. Send a weekly activity report with key usage statistics.
 * Uses listContent for structured statistics display.
 */
export async function sendWeeklyReportEmail(
  email: string,
  params: {
    userName: string;
    statsSummary: {
      safeArrivals: number;
      voiceCommands: number;
      recipesViewed: number;
      alertsSent: number;
    };
  }
): Promise<void> {
  try {
    if (!isEmailConfigured()) return;

    const { statsSummary: stats } = params;

    const content = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0 0 24px 0;color:#64748b;font-size:14px;line-height:1.5;">
              Bonjour ${params.userName},
            </p>
            <h2 style="margin:0 0 12px 0;color:#1a1a2e;font-size:20px;font-weight:700;line-height:1.3;">
              Votre rapport hebdomadaire
            </h2>
            <p style="margin:0 0 20px 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Voici un résumé de l'activité de votre foyer cette semaine. Ces données vous aident à comprendre et optimiser l'utilisation de votre maison intelligente.
            </p>
            ${listContent([
              { label: "🏠 Arrivées sécurisées", value: `${stats.safeArrivals} this week` },
              { label: "🎤 Commandes vocales", value: `${stats.voiceCommands} exécutées` },
              { label: "🍽️ Recettes consultées", value: `${stats.recipesViewed} recettes` },
              { label: "🔔 Alertes envoyées", value: `${stats.alertsSent} notifications` },
            ])}
            <p style="margin:24px 0 0 0;color:#1a1a2e;font-size:15px;line-height:1.7;">
              Continuez à explorer les fonctionnalités de Maison Consciente pour tirer le meilleur de votre foyer intelligent.
            </p>
          </td>
        </tr>
      </table>`;

    const html = generateEmailTemplate({
      subject: "📊 Votre rapport hebdomadaire — Maison Consciente",
      preheader: `${stats.safeArrivals} arrivées sécurisées, ${stats.voiceCommands} commandes vocales cette semaine.`,
      content,
      ctaUrl: "/dashboard",
      ctaText: "Voir le tableau de bord",
    });

    await sendMail({
      to: email,
      subject: "📊 Votre rapport hebdomadaire — Maison Consciente",
      html,
      priority: "low",
      headers: { "X-MC-Type": "weekly-report" },
    });
  } catch (err) {
    console.error("[EmailService] sendWeeklyReportEmail error:", err);
  }
}
