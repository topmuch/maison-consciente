'use server';

import { db } from '@/lib/db';

export async function getKnowledgeItems(householdId: string) {
  try {
    return await db.knowledgeBaseItem.findMany({
      where: { householdId, isActive: true },
      orderBy: [{ category: 'asc' }, { question: 'asc' }],
    });
  } catch {
    return [];
  }
}

export async function createKnowledgeItem(input: {
  householdId: string;
  question: string;
  answer: string;
  category: string;
  room?: string;
  keywords?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!input.question || !input.answer || !input.category || !input.householdId) {
      return { success: false, error: 'Champs requis manquants' };
    }
    await db.knowledgeBaseItem.create({
      data: {
        householdId: input.householdId,
        question: input.question,
        answer: input.answer,
        category: input.category,
        room: input.room || null,
        keywords: JSON.stringify(input.keywords || []),
      },
    });
    return { success: true };
  } catch (error) {
    console.error('[knowledge-actions] create error:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function updateKnowledgeItem(id: string, updates: {
  question?: string;
  answer?: string;
  category?: string;
  room?: string;
  keywords?: string[];
  isActive?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const data: Record<string, unknown> = {};
    if (updates.question !== undefined) data.question = updates.question;
    if (updates.answer !== undefined) data.answer = updates.answer;
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.room !== undefined) data.room = updates.room;
    if (updates.keywords !== undefined) data.keywords = JSON.stringify(updates.keywords);
    if (updates.isActive !== undefined) data.isActive = updates.isActive;

    await db.knowledgeBaseItem.update({ where: { id }, data });
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function deleteKnowledgeItem(id: string): Promise<{ success: boolean }> {
  try {
    await db.knowledgeBaseItem.delete({ where: { id } });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getKnowledgeCategories(householdId: string): Promise<string[]> {
  try {
    const items = await db.knowledgeBaseItem.findMany({
      where: { householdId, isActive: true },
      select: { category: true },
      distinct: ['category'],
    });
    return items.map(i => i.category);
  } catch {
    return [];
  }
}
