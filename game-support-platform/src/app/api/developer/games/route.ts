import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const games = await prisma.game.findMany({
    where: { authorId: session.userId },
    include: {
      _count: { select: { tickets: true, reviews: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(games);
}