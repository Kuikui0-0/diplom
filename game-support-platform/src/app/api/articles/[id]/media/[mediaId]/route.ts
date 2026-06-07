import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, mediaId } = await params;
  const gameId = Number(id);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { authorId: true },
  });
  if (!game) return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 });

  // Разрешаем автору игры или админу
  if (session.role !== 'admin' && session.userId !== game.authorId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const media = await prisma.gameMedia.findUnique({
    where: { id: Number(mediaId) },
    select: { url: true, gameId: true },
  });
  if (!media || media.gameId !== gameId) {
    return NextResponse.json({ error: 'Медиа не найдено' }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'public', media.url);
  try {
    await unlink(filePath);
  } catch (e) {}

  await prisma.gameMedia.delete({ where: { id: Number(mediaId) } });

  return NextResponse.json({ success: true });
}