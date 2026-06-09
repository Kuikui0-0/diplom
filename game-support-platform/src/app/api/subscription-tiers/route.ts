import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const gameId = Number(searchParams.get('gameId'));

  if (!gameId) {
    return NextResponse.json({ error: 'gameId required' }, { status: 400 });
  }

  const tiers = await prisma.subscriptionTier.findMany({
    where: { gameId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(tiers);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { gameId, name, price, benefits, maxSlots } = body;

    const game = await prisma.game.findUnique({
      where: { id: Number(gameId) },
      select: { authorId: true },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const isOwnerOrAdmin = session.userId === game.authorId || session.role === 'admin';
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tier = await prisma.subscriptionTier.create({
      data: {
        gameId: Number(gameId),
        name,
        price: Number(price),
        benefits: benefits || '',
        maxSlots: Number(maxSlots) || 100,
      },
    });

    return NextResponse.json(tier, { status: 201 });
  } catch (error) {
    console.error('POST tier error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}