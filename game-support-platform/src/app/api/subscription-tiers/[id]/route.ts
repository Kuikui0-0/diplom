import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

// PUT /api/subscription-tiers/123
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tierId = Number(id);

    const tier = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
      include: { game: { select: { authorId: true } } },
    });

    if (!tier) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isOwnerOrAdmin = session.userId === tier.game.authorId || session.role === 'admin';
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, price, benefits, maxSlots } = body;

    const updated = await prisma.subscriptionTier.update({
      where: { id: tierId },
      data: {
        name,
        price: Number(price),
        benefits: benefits || '',
        maxSlots: Number(maxSlots) || 100,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT tier error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/subscription-tiers/123
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tierId = Number(id);

    const tier = await prisma.subscriptionTier.findUnique({
      where: { id: tierId },
      include: { game: { select: { authorId: true } } },
    });

    if (!tier) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isOwnerOrAdmin = session.userId === tier.game.authorId || session.role === 'admin';
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.subscriptionTier.delete({
      where: { id: tierId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE tier error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}