import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tierId } = await request.json();
  const tier = await prisma.subscriptionTier.findUnique({ where: { id: tierId } });
  if (!tier) return NextResponse.json({ error: 'Tier not found' }, { status: 404 });

  // Проверяем, нет ли уже активной подписки на эту игру
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: session.userId,
      status: 'active',
      tier: { gameId: tier.gameId },
    },
  });
  if (existing) {
    return NextResponse.json({ error: 'Already subscribed to this game' }, { status: 400 });
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.userId,
      tierId: tier.id,
      status: 'active',
      startDate: new Date(),
    },
    include: { tier: { include: { game: true } } },
  });

  return NextResponse.json(subscription, { status: 201 });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json([]);

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.userId, status: 'active' },
    include: { tier: { include: { game: true } } },
  });

  return NextResponse.json(subscriptions);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscriptionId } = await request.json();
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId: session.userId },
  });
  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'cancelled', endDate: new Date() },
  });

  return NextResponse.json(updated);
}