// ═══════════════════════════════════════════════════════════════
// MAISON CONSCIENTE — Email Template Engine
//
// Generates professional responsive HTML emails with the
// Maison Consciente brand identity (gold #d4a853 on dark #0a0a0a).
// All styles are inline for maximum email client compatibility.
// ═══════════════════════════════════════════════════════════════

/* ── Types ── */
interface EmailTemplateParams {
  subject: string;
  preheader?: string;
  content: string;
  ctaUrl?: string;
  ctaText?: string;
  footerText?: string;
}

interface ListItem {
  label: string;
  value: string;
}

/* ── Brand Constants ── */
const BRAND = {
  name: "Maison Consciente",
  diamond: "◆",
  gold: "#d4a853",
  dark: "#0a0a0a",
  darkBg: "#020617",
  bodyText: "#1a1a2e",
  mutedText: "#64748b",
  white: "#ffffff",
  success: "#16a34a",
  warning: "#ea580c",
  danger: "#dc2626",
  bodyFont: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

/* ═══════════════════════════════════════════════════════════════
   CONTENT HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Generate HTML content for security alerts with urgent styling.
 * Displays a title, message, and optional list of action items.
 */
export function alertContent(
  title: string,
  message: string,
  items?: string[]
): string {
  const itemsHtml = items && items.length > 0
    ? `<ul style="margin:16px 0;padding:0 0 0 20px;color:${BRAND.bodyText};font-size:15px;line-height:1.6;">
        ${items.map((item) => `<li style="margin-bottom:6px;">${item}</li>`).join("")}
      </ul>`
    : "";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background-color:#fef2f2;border-left:4px solid ${BRAND.danger};padding:20px 24px;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 8px 0;color:${BRAND.danger};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
            ⚠ Alerte de Sécurité
          </p>
          <h2 style="margin:0 0 10px 0;color:${BRAND.bodyText};font-size:20px;font-weight:700;line-height:1.3;">
            ${title}
          </h2>
          <p style="margin:0 0 4px 0;color:${BRAND.bodyText};font-size:15px;line-height:1.6;">
            ${message}
          </p>
          ${itemsHtml}
        </td>
      </tr>
    </table>`;
}

/**
 * Generate HTML content for informational emails with warm styling.
 * Displays a title and message paragraph.
 */
export function infoContent(
  title: string,
  message: string
): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:8px 0;">
          <h2 style="margin:0 0 12px 0;color:${BRAND.bodyText};font-size:20px;font-weight:700;line-height:1.3;">
            ${title}
          </h2>
          <p style="margin:0;color:${BRAND.bodyText};font-size:15px;line-height:1.7;">
            ${message}
          </p>
        </td>
      </tr>
    </table>`;
}

/**
 * Generate HTML content for CTA (call-to-action) emails.
 * Displays a title, message, and a prominent action button.
 */
export function ctaContent(
  title: string,
  message: string,
  ctaUrl: string,
  ctaText: string
): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:8px 0;">
          <h2 style="margin:0 0 12px 0;color:${BRAND.bodyText};font-size:20px;font-weight:700;line-height:1.3;">
            ${title}
          </h2>
          <p style="margin:0 0 24px 0;color:${BRAND.bodyText};font-size:15px;line-height:1.7;">
            ${message}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-radius:8px;background-color:${BRAND.gold};">
                <a href="${ctaUrl}"
                   target="_blank"
                   style="display:inline-block;padding:14px 28px;color:${BRAND.white};text-decoration:none;font-size:15px;font-weight:600;border-radius:8px;">
                  ${ctaText}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

/**
 * Generate HTML content for summary/report emails with a key-value list.
 * Displays rows with label-value pairs in a structured layout.
 */
export function listContent(items: ListItem[]): string {
  const rowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:${BRAND.mutedText};font-size:14px;font-weight:500;vertical-align:top;white-space:nowrap;width:40%;">
          ${item.label}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:${BRAND.bodyText};font-size:14px;font-weight:600;vertical-align:top;">
          ${item.value}
        </td>
      </tr>`
    )
    .join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      ${rowsHtml}
    </table>`;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN TEMPLATE GENERATOR
   ═══════════════════════════════════════════════════════════════ */

/**
 * Generate a complete, responsive HTML email with the Maison Consciente branding.
 * All CSS is inline for maximum email client compatibility.
 *
 * @param params - Template parameters (subject, preheader, content, CTA, footer)
 * @returns Complete HTML string ready to send via nodemailer
 */
export function generateEmailTemplate(params: EmailTemplateParams): string {
  const { subject, preheader, content, ctaUrl, ctaText, footerText } = params;

  // Preheader text (shown in inbox preview)
  const preheaderHtml = preheader
    ? `
    <div style="display:none;font-size:1px;color:${BRAND.dark};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${preheader}
    </div>`
    : "";

  // CTA button (rendered below content if provided)
  const ctaHtml = ctaUrl && ctaText
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:28px 0 8px 0;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-radius:8px;background-color:${BRAND.gold};">
                <a href="${ctaUrl}"
                   target="_blank"
                   style="display:inline-block;padding:14px 28px;color:${BRAND.white};text-decoration:none;font-size:15px;font-weight:600;border-radius:8px;">
                  ${ctaText}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
    : "";

  // Custom footer text (shown above the default footer if provided)
  const customFooterHtml = footerText
    ? `<p style="margin:0 0 16px 0;color:${BRAND.mutedText};font-size:13px;line-height:1.5;">
        ${footerText}
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .stack-column-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.darkBg};font-family:${BRAND.bodyFont};">
  ${preheaderHtml}

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.darkBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Inner container — max 600px -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container" style="max-width:600px;width:100%;margin:0 auto;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background-color:${BRAND.dark};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align:center;">
                    <!-- Gold diamond separator -->
                    <p style="margin:0 0 12px 0;color:${BRAND.gold};font-size:18px;line-height:1;">
                      ${BRAND.diamond}
                    </p>
                    <!-- Brand name -->
                    <h1 style="margin:0;color:${BRAND.white};font-size:22px;font-weight:700;letter-spacing:2px;text-transform:uppercase;line-height:1.2;">
                      ${BRAND.name}
                    </h1>
                    <!-- Thin gold divider -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="60" align="center" style="margin:16px auto 0 auto;">
                      <tr>
                        <td style="border-top:2px solid ${BRAND.gold};height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ BODY ═══ -->
          <tr>
            <td style="background-color:${BRAND.white};padding:32px;">
              ${content}
              ${ctaHtml}
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background-color:${BRAND.dark};border-radius:0 0 12px 12px;padding:28px 32px;">
              ${customFooterHtml}
              <!-- Navigation links -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;">
                <tr>
                  <td style="text-align:center;">
                    <a href="/legal/privacy" target="_blank" style="color:${BRAND.mutedText};text-decoration:underline;font-size:12px;margin:0 12px;">
                      Politique de confidentialité
                    </a>
                    <span style="color:${BRAND.mutedText};font-size:12px;">|</span>
                    <a href="/contact" target="_blank" style="color:${BRAND.mutedText};text-decoration:underline;font-size:12px;margin:0 12px;">
                      Contact
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Copyright -->
              <p style="margin:0;text-align:center;color:${BRAND.mutedText};font-size:11px;line-height:1.5;">
                &copy; ${new Date().getFullYear()} ${BRAND.name}. Tous droits réservés.
              </p>
              <!-- Address -->
              <p style="margin:8px 0 0 0;text-align:center;color:#475569;font-size:10px;line-height:1.5;">
                Maison Consciente — Votre maison intelligente, en toute conscience.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Inner container -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`;
}
