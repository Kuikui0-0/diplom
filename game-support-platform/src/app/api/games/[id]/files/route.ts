import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const gameId = Number(id);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { authorId: true },
  });
  if (!game || (session.role !== 'admin' && session.userId !== game.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { url, platformId } = await request.json();
  if (!url || !platformId) {
    return NextResponse.json({ error: 'URL and platformId are required' }, { status: 400 });
  }

  await prisma.gameFile.deleteMany({
    where: { gameId, platformId: Number(platformId) },
  });

  const gameFile = await prisma.gameFile.create({
    data: {
      url,
      platformId: Number(platformId),
      gameId,
    },
  });

  return NextResponse.json(gameFile, { status: 201 });
}