import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

// Получить обновления игры
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);

  const updates = await prisma.gameUpdate.findMany({
    where: { gameId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(updates);
}

// Создать обновление (только автор игры или админ)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await params;
  const gameId = Number(id);

  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { authorId: true },
  });

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const isOwnerOrAdmin = session.userId === game.authorId || session.role === 'admin';
  if (!isOwnerOrAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { version, title, content } = body;

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
  }

  const update = await prisma.gameUpdate.create({
    data: {
      gameId,
      version: version || null,
      title,
      content,
    },
  });

  return NextResponse.json(update, { status: 201 });
}