import { put } from '@vercel/blob';
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

  // Проверка прав (автор или админ)
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { authorId: true },
  });
  if (!game || (session.role !== 'admin' && session.userId !== game.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { filename, platformId } = await request.json();
  if (!filename || !platformId) {
    return NextResponse.json({ error: 'Filename and platformId are required' }, { status: 400 });
  }

  // Генерируем подписанный URL для прямой загрузки
  const blob = await put(`games/${gameId}/platforms/${platformId}/${filename}`, {
    access: 'public',
    addRandomSuffix: true,
  });

  // Возвращаем URL, по которому клиент может загрузить файл методом PUT
  return NextResponse.json({
    uploadUrl: blob.url,
    blobUrl: blob.url, // это готовый публичный URL после загрузки
  });
}