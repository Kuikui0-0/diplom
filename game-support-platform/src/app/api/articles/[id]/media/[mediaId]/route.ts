import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, mediaId } = await params;
  const articleId = Number(id);

  const media = await prisma.articleMedia.findUnique({
    where: { id: Number(mediaId) },
    include: { article: { select: { authorId: true } } },
  });
  if (!media || media.articleId !== articleId) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }
  if (media.article.authorId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Удаляем из Blob
  try {
    await del(media.url);
  } catch (e) {
    console.warn('Ошибка удаления из Blob:', e);
  }

  await prisma.articleMedia.delete({ where: { id: Number(mediaId) } });

  return NextResponse.json({ success: true });
}