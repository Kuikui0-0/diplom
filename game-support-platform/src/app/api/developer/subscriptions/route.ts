import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tiers = await prisma.subscriptionTier.findMany({
    where: {
      game: {
        OR: [
          { articles: { some: { authorId: session.userId } } },
          { tickets: { some: { authorId: session.userId } } },
        ],
      },
    },
    include: { game: true },
  });

  return NextResponse.json(tiers);
}