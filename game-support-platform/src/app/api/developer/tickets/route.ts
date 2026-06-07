// src/app/api/developer/tickets/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const developerGames = await prisma.game.findMany({
    where: { authorId: session.userId },
    select: { id: true },
  });
  const gameIds = developerGames.map(g => g.id);

  const tickets = await prisma.ticket.findMany({
    where: { gameId: { in: gameIds } },
    include: {
      game: { select: { title: true } },
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(tickets);
}