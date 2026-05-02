/* ═══════════════════════════════════════════════════════
   MAELLIS — Gemini 2.0 Flash-Lite Analysis Service

   Analyzes daily check transcriptions and generates
   comprehensive stay review reports using Gemini AI.
   ═══════════════════════════════════════════════════════ */

import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/aes-crypto";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface DailyCheckAnalysis {
  overallScore: number;
  sentiment: "positive" | "neutral" | "negative" | "critical";
  issues: string[];
  keywords: string[];
  aiSummary: string;
  categoryScores: {
    cleanliness: number;
    comfort: number;
    equipment: number;
    location: number;
    hostContact: number;
    valueForMoney: number;
  };
}

export interface StayReviewData {
  guestName: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  dailyChecks: {
    id: string;
    checkType: string;
    overallScore: number | null;
    sentiment: string | null;
    issues: string[];
    keywords: string[];
    aiSummary: string | null;
    transcription: string | null;
    checkDate: Date;
  }[];
  alerts: {
    id: string;
    severity: string;
    category: string;
    message: string;
    status: string;
    createdAt: Date;
  }[];
}

export interface StayReviewReportData {
  cleanliness: number;
  comfort: number;
  equipment: number;
  location: number;
  hostContact: number;
  valueForMoney: number;
  overallScore: number;
  sentiment: string;
  sentimentScore: number;
  verbatim: string;
  highlights: string[];
  painPoints: string[];
  keywords: string[];
  aiSummary: string;
  recommendation: string;
  publicReview: string;
  dailyCheckCount: number;
  totalAlerts: number;
  resolvedAlerts: number;
}

/* ═══════════════════════════════════════════════════════
   Gemini API Helper
   ═══════════════════════════════════════════════════════ */

const GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function getGeminiApiKey(): Promise<string | null> {
  try {
    const config = await db.apiConfig.findUnique({
      where: { serviceKey: "GEMINI" },
    });

    if (!config || !config.isActive) {
      return null;
    }

    return decryptSecret(config.apiKey);
  } catch (error) {
    console.error("[Gemini] Error reading config:", error);
    return null;
  }
}

async function callGemini(
  prompt: string,
  maxRetries = 2
): Promise<string | null> {
  const apiKey = await getGeminiApiKey();

  if (!apiKey) {
    console.error("[Gemini] API key not configured");
    return null;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `${GEMINI_BASE_URL}?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.status === 429 && attempt < maxRetries) {
        // Rate limited — wait and retry
        const waitMs = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(
          `[Gemini] API error (attempt ${attempt + 1}):`,
          response.status,
          errorData
        );
        if (attempt < maxRetries) continue;
        return null;
      }

      const data = await response.json();

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error("[Gemini] Empty response");
        return null;
      }

      return text;
    } catch (error) {
      console.error(`[Gemini] Network error (attempt ${attempt + 1}):`, error);
      if (attempt < maxRetries) continue;
      return null;
    }
  }

  return null;
}

/* ═══════════════════════════════════════════════════════
   Analyze Daily Check Transcription
   ═══════════════════════════════════════════════════════ */

const ANALYSIS_PROMPT = `Tu es un analyste d'expérience client pour l'hôtellerie et la location courte durée. Tu analyses les transcriptions d'appels de satisfaction en français.

Analyse la transcription suivante et extrais les informations demandées au format JSON strict.

## Règles
- overallScore : note globale de 1 (très mauvais) à 5 (excellent)
- sentiment : "positive", "neutral", "negative", ou "critical"
- issues : liste des problèmes détectés (tableau de chaînes, vide si aucun)
- keywords : mots-clés pertinents extraits (tableau de chaînes, 3-8 mots)
- aiSummary : résumé en 2-3 phrases en français de l'expérience de l'invité
- categoryScores : notes par catégorie (1-5 chacune) :
  - cleanliness : propreté
  - comfort : confort (lit, literie, espace)
  - equipment : équipement (WiFi, climatisation, TV, cuisine)
  - location : emplacement et accessibilité
  - hostContact : qualité du contact avec l'hôte
  - valueForMoney : rapport qualité-prix

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte supplémentaire.

## Transcription :
{TRANSCRIPTION}`;

/**
 * Analyze a daily check transcription using Gemini 2.0 Flash-Lite.
 * 1. Reads GEMINI API key from ApiConfig table
 * 2. Calls Gemini with a structured prompt
 * 3. Updates the DailyCheck record with analysis results
 * 4. If negative/critical OR score < 4 → creates a HostAlert
 * 5. Returns the analysis results
 */
export async function analyzeDailyCheckTranscription(
  dailyCheckId: string,
  transcription: string
): Promise<DailyCheckAnalysis | null> {
  if (!transcription || transcription.trim().length === 0) {
    console.warn("[Gemini] Empty transcription — skipping analysis");
    return null;
  }

  const prompt = ANALYSIS_PROMPT.replace("{TRANSCRIPTION}", transcription);
  const rawResponse = await callGemini(prompt);

  if (!rawResponse) {
    console.error("[Gemini] Failed to analyze transcription");
    return null;
  }

  // Parse the JSON response from Gemini
  let analysis: DailyCheckAnalysis;
  try {
    // Clean up response — remove markdown code fences if present
    const cleaned = rawResponse
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    analysis = JSON.parse(cleaned) as DailyCheckAnalysis;

    // Validate and clamp scores
    analysis.overallScore = Math.max(1, Math.min(5, Math.round(analysis.overallScore)));
    analysis.categoryScores = {
      cleanliness: Math.max(1, Math.min(5, Math.round(analysis.categoryScores?.cleanliness || 3))),
      comfort: Math.max(1, Math.min(5, Math.round(analysis.categoryScores?.comfort || 3))),
      equipment: Math.max(1, Math.min(5, Math.round(analysis.categoryScores?.equipment || 3))),
      location: Math.max(1, Math.min(5, Math.round(analysis.categoryScores?.location || 3))),
      hostContact: Math.max(1, Math.min(5, Math.round(analysis.categoryScores?.hostContact || 3))),
      valueForMoney: Math.max(1, Math.min(5, Math.round(analysis.categoryScores?.valueForMoney || 3))),
    };

    // Validate sentiment
    const validSentiments = ["positive", "neutral", "negative", "critical"];
    if (!validSentiments.includes(analysis.sentiment)) {
      analysis.sentiment = "neutral";
    }
  } catch (parseError) {
    console.error("[Gemini] Failed to parse analysis response:", parseError);
    console.error("[Gemini] Raw response:", rawResponse);
    return null;
  }

  // Update the DailyCheck record with analysis results
  try {
    const dailyCheck = await db.dailyCheck.update({
      where: { id: dailyCheckId },
      data: {
        overallScore: analysis.overallScore,
        sentiment: analysis.sentiment,
        issues: JSON.stringify(analysis.issues || []),
        keywords: JSON.stringify(analysis.keywords || []),
        aiSummary: analysis.aiSummary || null,
        status: "completed",
      },
    });

    // 4. Trigger HostAlert if negative/critical OR score < 4
    const needsAlert =
      analysis.sentiment === "negative" ||
      analysis.sentiment === "critical" ||
      analysis.overallScore < 4;

    if (needsAlert && analysis.issues.length > 0) {
      // Determine severity
      let severity: "low" | "medium" | "high" | "critical" = "medium";
      if (analysis.sentiment === "critical" || analysis.overallScore <= 1) {
        severity = "critical";
      } else if (analysis.sentiment === "negative" || analysis.overallScore <= 2) {
        severity = "high";
      } else if (analysis.overallScore === 3) {
        severity = "medium";
      }

      // Determine category from issues
      const category = mapIssuesToCategory(analysis.issues);

      await db.hostAlert.create({
        data: {
          householdId: dailyCheck.householdId,
          dailyCheckId: dailyCheck.id,
          checkInStateId: dailyCheck.checkInStateId,
          guestName: dailyCheck.guestName,
          severity,
          category,
          message: analysis.issues.join(". "),
          transcription: transcription.substring(0, 2000),
          status: "pending",
          notifiedVia: "auto_detected",
        },
      });

      // Mark the daily check as alerted
      await db.dailyCheck.update({
        where: { id: dailyCheckId },
        data: { hostAlerted: true },
      });

      console.log(
        `[Gemini] Alert triggered for daily check ${dailyCheckId}: ${severity} — ${category}`
      );
    }
  } catch (dbError) {
    console.error("[Gemini] Error updating DailyCheck:", dbError);
  }

  return analysis;
}

/* ═══════════════════════════════════════════════════════
   Category Mapping Helper
   ═══════════════════════════════════════════════════════ */

function mapIssuesToCategory(issues: string[]): string {
  const issueText = issues.join(" ").toLowerCase();

  const categoryMap: Array<[string[], string]> = [
    [["propre", "sale", "menage", "nettoy", "odeur"], "cleanliness"],
    [["lit", "matelas", "bruit", "insonoris", "confort", "chambre"], "comfort"],
    [["wi-fi", "wifi", "internet", "clim", "chauff", "tv", "cuisin", "équip", "machine"], "equipment"],
    [["bruy", "voisin", "extérieu", "quartier", "parking", "accès", "transport"], "location"],
    [["hôte", "contact", "réponse", "commun"], "hostContact"],
    [["prix", "cher", "rapport", "argent", "coût", "factur"], "valueForMoney"],
  ];

  for (const [kws, category] of categoryMap) {
    if (kws.some((kw) => issueText.includes(kw))) {
      return category;
    }
  }

  return "other";
}

/* ═══════════════════════════════════════════════════════
   Generate Stay Review Report
   ═══════════════════════════════════════════════════════ */

const REPORT_PROMPT = `Tu es un consultant en expérience client pour l'hôtellerie de luxe. Tu génères un rapport complet de fin de séjour basé sur les données collectées.

Analyse les données du séjour suivantes et génère un rapport complet au format JSON strict.

## Données du séjour :
- Invité : {GUEST_NAME}
- Arrivé le : {CHECK_IN}
- Départ le : {CHECK_OUT}
- Nombre de vérifications : {CHECK_COUNT}
- Nombre d'alertes : {ALERT_COUNT}
- Alertes résolues : {RESOLVED_COUNT}

## Vérifications quotidiennes :
{DAILY_CHECKS}

## Alertes :
{ALERTS}

## Format de réponse attendu (JSON strict) :
{
  "cleanliness": <note 1-5>,
  "comfort": <note 1-5>,
  "equipment": <note 1-5>,
  "location": <note 1-5>,
  "hostContact": <note 1-5>,
  "valueForMoney": <note 1-5>,
  "overallScore": <moyenne pondérée 1-5 avec 2 décimales>,
  "sentiment": "<positive|neutral|negative|critical>",
  "sentimentScore": <score -1.0 à 1.0>,
  "verbatim": "<citation directe la plus représentative de l'expérience, extraite des transcriptions>",
  "highlights": ["<point positif 1>", "<point positif 2>", ...],
  "painPoints": ["<point négatif/problème 1>", "<point négatif/problème 2>", ...],
  "keywords": ["<mot-clé 1>", "<mot-clé 2>", ...],
  "aiSummary": "<résumé narratif de 4-6 phrases en français couvrant l'ensemble du séjour>",
  "recommendation": "<suggestion concrète d'amélioration prioritaire pour l'hôte>",
  "publicReview": "<brouillon d'avis public positif en français, 3-4 phrases, adapté pour Airbnb/Booking, à partir des points forts identifiés>"
}

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte supplémentaire.`;

/**
 * Generate a comprehensive stay review report.
 * 1. Fetches all DailyCheck records for the stay
 * 2. Aggregates scores, sentiments, and issues
 * 3. Calls Gemini to generate a StayReviewReport
 * 4. Creates/updates StayReviewReport record
 * 5. Returns the report
 */
export async function generateStayReviewReport(
  checkInStateId: string
): Promise<StayReviewReportData | null> {
  // 1. Get the CheckInState
  const checkInState = await db.checkInState.findUnique({
    where: { id: checkInStateId },
  });

  if (!checkInState) {
    console.error("[Gemini Report] CheckInState not found:", checkInStateId);
    return null;
  }

  // 2. Fetch all DailyChecks for this stay
  const dailyChecks = await db.dailyCheck.findMany({
    where: {
      checkInStateId,
      status: { in: ["completed", "no_answer"] },
    },
    orderBy: { checkDate: "asc" },
  });

  if (dailyChecks.length === 0) {
    console.warn(
      "[Gemini Report] No completed daily checks for stay:",
      checkInStateId
    );
    return null;
  }

  // 3. Fetch alerts for this stay
  const alerts = await db.hostAlert.findMany({
    where: {
      checkInStateId,
    },
    orderBy: { createdAt: "asc" },
  });

  // 4. Prepare data for Gemini
  const dailyChecksText = dailyChecks
    .map((dc) => {
      const score = dc.overallScore ?? "N/A";
      const sentiment = dc.sentiment ?? "N/A";
      const issues: string[] = [];
      try {
        const parsed = JSON.parse(dc.issues);
        if (Array.isArray(parsed)) issues.push(...parsed);
      } catch { /* empty issues */ }
      const keywords: string[] = [];
      try {
        const parsed = JSON.parse(dc.keywords);
        if (Array.isArray(parsed)) keywords.push(...parsed);
      } catch { /* empty keywords */ }
      const transcription = dc.transcription
        ? dc.transcription.substring(0, 500)
        : "Pas de transcription";
      const summary = dc.aiSummary || "Pas de résumé";

      return `[${dc.checkType}] Date: ${dc.checkDate.toLocaleDateString("fr-FR")} | Score: ${score}/5 | Sentiment: ${sentiment}
Transcription: ${transcription}
Résumé IA: ${summary}
Problèmes: ${issues.length > 0 ? issues.join(", ") : "Aucun"}
Mots-clés: ${keywords.join(", ")}`;
    })
    .join("\n\n---\n\n");

  const alertsText =
    alerts.length > 0
      ? alerts
          .map(
            (a) =>
              `[${a.severity}] ${a.category}: ${a.message} (Statut: ${a.status})`
          )
          .join("\n")
      : "Aucune alerte";

  const prompt = REPORT_PROMPT
    .replace("{GUEST_NAME}", checkInState.guestName)
    .replace("{CHECK_IN}", checkInState.checkInAt.toLocaleDateString("fr-FR"))
    .replace(
      "{CHECK_OUT}",
      checkInState.checkOutAt
        ? checkInState.checkOutAt.toLocaleDateString("fr-FR")
        : "En cours"
    )
    .replace("{CHECK_COUNT}", String(dailyChecks.length))
    .replace("{ALERT_COUNT}", String(alerts.length))
    .replace("{RESOLVED_COUNT}", String(alerts.filter((a) => a.status === "resolved").length))
    .replace("{DAILY_CHECKS}", dailyChecksText)
    .replace("{ALERTS}", alertsText);

  // 5. Call Gemini
  const rawResponse = await callGemini(prompt, 3);

  if (!rawResponse) {
    console.error("[Gemini Report] Failed to generate report");
    return null;
  }

  // 6. Parse the report
  let reportData: StayReviewReportData;
  try {
    const cleaned = rawResponse
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    reportData = JSON.parse(cleaned) as StayReviewReportData;

    // Validate scores
    const scoreFields = [
      "cleanliness",
      "comfort",
      "equipment",
      "location",
      "hostContact",
      "valueForMoney",
    ] as const;

    for (const field of scoreFields) {
      reportData[field] = Math.max(1, Math.min(5, Math.round(reportData[field] || 3)));
    }

    reportData.overallScore = Math.max(
      1,
      Math.min(5, parseFloat(String(reportData.overallScore)) || 3)
    );

    // Validate sentiment
    const validSentiments = ["positive", "neutral", "negative", "critical"];
    if (!validSentiments.includes(reportData.sentiment)) {
      reportData.sentiment = "neutral";
    }

    reportData.sentimentScore = Math.max(
      -1,
      Math.min(1, parseFloat(String(reportData.sentimentScore)) || 0)
    );

    // Ensure arrays
    reportData.highlights = Array.isArray(reportData.highlights)
      ? reportData.highlights
      : [];
    reportData.painPoints = Array.isArray(reportData.painPoints)
      ? reportData.painPoints
      : [];
    reportData.keywords = Array.isArray(reportData.keywords)
      ? reportData.keywords
      : [];
  } catch (parseError) {
    console.error("[Gemini Report] Failed to parse report:", parseError);
    console.error("[Gemini Report] Raw response:", rawResponse);
    return null;
  }

  // 7. Create or update the StayReviewReport in DB
  try {
    await db.stayReviewReport.upsert({
      where: { checkInStateId },
      create: {
        householdId: checkInState.householdId,
        checkInStateId,
        guestName: checkInState.guestName,
        checkInAt: checkInState.checkInAt,
        checkOutAt: checkInState.checkOutAt,
        cleanliness: reportData.cleanliness,
        comfort: reportData.comfort,
        equipment: reportData.equipment,
        location: reportData.location,
        hostContact: reportData.hostContact,
        valueForMoney: reportData.valueForMoney,
        overallScore: reportData.overallScore,
        sentiment: reportData.sentiment,
        sentimentScore: reportData.sentimentScore,
        verbatim: reportData.verbatim || null,
        highlights: JSON.stringify(reportData.highlights),
        painPoints: JSON.stringify(reportData.painPoints),
        keywords: JSON.stringify(reportData.keywords),
        aiSummary: reportData.aiSummary || null,
        recommendation: reportData.recommendation || null,
        publicReview: reportData.publicReview || null,
        dailyCheckCount: dailyChecks.length,
        totalAlerts: alerts.length,
        resolvedAlerts: alerts.filter((a) => a.status === "resolved").length,
      },
      update: {
        cleanliness: reportData.cleanliness,
        comfort: reportData.comfort,
        equipment: reportData.equipment,
        location: reportData.location,
        hostContact: reportData.hostContact,
        valueForMoney: reportData.valueForMoney,
        overallScore: reportData.overallScore,
        sentiment: reportData.sentiment,
        sentimentScore: reportData.sentimentScore,
        verbatim: reportData.verbatim || null,
        highlights: JSON.stringify(reportData.highlights),
        painPoints: JSON.stringify(reportData.painPoints),
        keywords: JSON.stringify(reportData.keywords),
        aiSummary: reportData.aiSummary || null,
        recommendation: reportData.recommendation || null,
        publicReview: reportData.publicReview || null,
        dailyCheckCount: dailyChecks.length,
        totalAlerts: alerts.length,
        resolvedAlerts: alerts.filter((a) => a.status === "resolved").length,
        generatedAt: new Date(),
      },
    });

    console.log(
      `[Gemini Report] Report generated for stay ${checkInStateId} — Score: ${reportData.overallScore}/5 (${reportData.sentiment})`
    );
  } catch (dbError) {
    console.error("[Gemini Report] Error saving report:", dbError);
  }

  return reportData;
}
