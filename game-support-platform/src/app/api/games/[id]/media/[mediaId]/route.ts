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
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, mediaId } = await params;
  const media = await prisma.gameMedia.findUnique({
    where: { id: Number(mediaId) },
    select: { gameId: true, url: true },
  });

  if (!media || media.gameId !== Number(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Удаляем файл с диска
  const filePath = path.join(process.cwd(), 'public', media.url);
  try {
    await unlink(filePath);
  } catch (e) {
    // файл может уже отсутствовать
  }

  await prisma.gameMedia.delete({ where: { id: Number(mediaId) } });

  return NextResponse.json({ success: true });
}