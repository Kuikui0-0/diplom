import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { del } from '@vercel/blob';

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

  // Удаляем файл из Blob Storage
  try {
    await del(media.url);
  } catch (e) {
    // Если файл уже удалён – игнорируем
  }

  await prisma.gameMedia.delete({ where: { id: Number(mediaId) } });

  return NextResponse.json({ success: true });
}