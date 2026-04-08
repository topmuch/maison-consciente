/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Hospitality Support API
   Submit, list, and manage guest support tickets.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { requireHouseholdType, requireRole } from '@/core/auth/guards';

/** Valid issue types */
const VALID_TYPES = ['cleaning', 'equipment', 'access', 'other'] as const;
type IssueType = (typeof VALID_TYPES)[number];

/** Valid ticket statuses */
const VALID_STATUSES = ['open', 'resolved', 'ignored'] as const;
type TicketStatus = (typeof VALID_STATUSES)[number];

function isValidType(value: unknown): value is IssueType {
  return typeof value === 'string' && (VALID_TYPES as readonly string[]).includes(value);
}

function isValidStatus(value: unknown): value is TicketStatus {
  return typeof value === 'string' && (VALID_STATUSES as readonly string[]).includes(value);
}

// POST — Submit a support ticket
export async function POST(request: NextRequest) {
  try {
    const { householdId, user } = await requireHouseholdType('hospitality');
    const body = await request.json();
    const { type, message, photoBase64 } = body;

    // Validate issue type
    if (!isValidType(type)) {
      return NextResponse.json(
        { success: false, error: 'Type de problème invalide' },
        { status: 400 },
      );
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Le message est requis' },
        { status: 400 },
      );
    }

    if (message.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Le message ne doit pas dépasser 1000 caractères' },
        { status: 400 },
      );
    }

    // Validate photo if provided (must be a base64 data URL for image)
    if (photoBase64 && typeof photoBase64 === 'string') {
      if (!photoBase64.startsWith('data:image/')) {
        return NextResponse.json(
          { success: false, error: 'Format de photo invalide' },
          { status: 400 },
        );
      }
      // Rough size check: ~7.3 MB in base64 (5MB * 1.37 base64 overhead)
      if (photoBase64.length > 10_000_000) {
        return NextResponse.json(
          { success: false, error: 'La photo est trop volumineuse (max 5 Mo)' },
          { status: 400 },
        );
      }
    }

    // Create support ticket
    const ticket = await db.supportTicket.create({
      data: {
        householdId,
        type,
        message: message.trim(),
        photoUrl: photoBase64 || null,
        status: 'open',
      },
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN_TYPE') {
      return NextResponse.json(
        { success: false, error: 'Accès réservé au mode hospitalité' },
        { status: 403 },
      );
    }
    if (
      error instanceof Error &&
      (error.message === 'UNAUTHORIZED' || error.message === 'NO_HOUSEHOLD')
    ) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 },
      );
    }
    console.error('[HOSPITALITY] Support POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}

// GET — List support tickets (optionally filtered by status)
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType('hospitality');
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = { householdId };
    if (statusFilter && isValidStatus(statusFilter)) {
      where.status = statusFilter;
    }

    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN_TYPE') {
      return NextResponse.json(
        { success: false, error: 'Accès réservé au mode hospitalité' },
        { status: 403 },
      );
    }
    if (
      error instanceof Error &&
      (error.message === 'UNAUTHORIZED' || error.message === 'NO_HOUSEHOLD')
    ) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 },
      );
    }
    console.error('[HOSPITALITY] Support GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}

// PATCH — Update ticket status (owner/admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { householdId } = await requireRole('owner', 'superadmin');
    const body = await request.json();
    const { ticketId, status } = body;

    if (!ticketId || typeof ticketId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ID du ticket requis' },
        { status: 400 },
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        { success: false, error: 'Statut invalide (open, resolved, ignored)' },
        { status: 400 },
      );
    }

    // Verify ticket belongs to this household
    const existingTicket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      select: { householdId: true },
    });

    if (!existingTicket || existingTicket.householdId !== householdId) {
      return NextResponse.json(
        { success: false, error: 'Ticket introuvable' },
        { status: 404 },
      );
    }

    const ticket = await db.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { success: false, error: 'Accès réservé aux propriétaires' },
        { status: 403 },
      );
    }
    if (
      error instanceof Error &&
      (error.message === 'UNAUTHORIZED' || error.message === 'NO_HOUSEHOLD')
    ) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 },
      );
    }
    console.error('[HOSPITALITY] Support PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
