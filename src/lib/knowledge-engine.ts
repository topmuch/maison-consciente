// ═══════════════════════════════════════════════════════
// MAISON CONSCIENTE — Knowledge Engine
// Fuzzy/semantic search for the FAQ knowledge base
// ═══════════════════════════════════════════════════════

import { db } from '@/lib/db';

export interface KnowledgeResult {
  id: string;
  question: string;
  answer: string;
  category: string;
  room: string | null;
  confidence: number; // 0-1
}

/* ── Normalization helpers ── */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')    // Remove punctuation
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim();
}

function tokenize(text: string): Set<string> {
  const normalized = normalize(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 1);
  return new Set(words);
}

/* ── Scoring ── */
function computeScore(
  queryTokens: Set<string>,
  queryNorm: string,
  question: string,
  answer: string,
  keywords: string[],
): number {
  let score = 0;
  
  // 1. Exact match in question (highest weight)
  const questionNorm = normalize(question);
  if (questionNorm === queryNorm) return 1.0;
  if (questionNorm.includes(queryNorm)) score += 0.8;
  if (queryNorm.includes(questionNorm)) score += 0.7;
  
  // 2. Keyword matching (high weight)
  const keywordMatches = keywords.filter(kw => {
    const kwNorm = normalize(kw);
    return queryTokens.has(kwNorm) || queryNorm.includes(kwNorm);
  });
  if (keywords.length > 0) {
    score += (keywordMatches.length / keywords.length) * 0.6;
  }
  
  // 3. Token overlap with question
  const questionTokens = tokenize(question);
  let overlapCount = 0;
  for (const token of queryTokens) {
    if (questionTokens.has(token)) overlapCount++;
  }
  const questionScore = questionTokens.size > 0 
    ? (overlapCount / questionTokens.size) * 0.5 
    : 0;
  score += questionScore;
  
  // 4. Token overlap with answer (lower weight)
  const answerTokens = tokenize(answer);
  let answerOverlap = 0;
  for (const token of queryTokens) {
    if (answerTokens.has(token)) answerOverlap++;
  }
  const answerScore = answerTokens.size > 0
    ? (answerOverlap / answerTokens.size) * 0.2
    : 0;
  score += answerScore;
  
  // 5. Partial string match in question (medium weight)
  const queryWords = Array.from(queryTokens).filter(w => w.length > 3);
  for (const word of queryWords) {
    if (questionNorm.includes(word)) score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

/* ═══════════════════════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════════════════════ */

const MIN_CONFIDENCE = 0.15;
const MAX_RESULTS = 3;

export async function searchKnowledgeBase(
  query: string,
  householdId: string,
): Promise<KnowledgeResult[]> {
  try {
    const items = await db.knowledgeBaseItem.findMany({
      where: {
        householdId,
        isActive: true,
      },
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        room: true,
        keywords: true,
      },
    });

    if (items.length === 0) return [];

    const queryTokens = tokenize(query);
    const queryNorm = normalize(query);

    const scored: KnowledgeResult[] = items.map((item) => {
      const keywords = typeof item.keywords === 'string'
        ? JSON.parse(item.keywords) as string[]
        : Array.isArray(item.keywords)
          ? item.keywords
          : [];

      const confidence = computeScore(queryTokens, queryNorm, item.question, item.answer, keywords);

      return {
        id: item.id,
        question: item.question,
        answer: item.answer,
        category: item.category,
        room: item.room,
        confidence,
      };
    });

    // Sort by confidence descending, filter by minimum threshold
    return scored
      .filter(r => r.confidence >= MIN_CONFIDENCE)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_RESULTS);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[knowledge-engine] Search error:', error);
    }
    return [];
  }
}

/* ═══════════════════════════════════════════════════════
   FORMAT FOR VOICE
   ═══════════════════════════════════════════════════════ */

export function formatKnowledgeForVoice(result: KnowledgeResult): string {
  return result.answer;
}
