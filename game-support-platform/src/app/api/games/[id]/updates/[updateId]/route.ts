import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  const session = await getSession();
  const { id, updateId } = await params;
  const gameId = Number(id);
  const updateIdNum = Number(updateId);

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

  await prisma.gameUpdate.delete({
    where: { id: updateIdNum },
  });

  return NextResponse.json({ success: true });
}