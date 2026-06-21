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

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const platformId = Number(formData.get('platformId'));

  if (!file || !platformId) {
    return NextResponse.json({ error: 'Файл и платформа обязательны' }, { status: 400 });
  }

  // Ограничение размера (4.5 МБ)
  if (file.size > 4.5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Файл слишком большой (макс. 4.5 МБ)' }, { status: 400 });
  }

  // Загрузка в Vercel Blob (исправлен путь)
  const blob = await put(`games/${gameId}/platforms/${platformId}/${file.name}`, file, {
    access: 'public',
  });

  // Удаляем старый файл для этой платформы, если есть
  await prisma.gameFile.deleteMany({
    where: { gameId, platformId },
  });

  // Сохраняем запись в базе данных
  const gameFile = await prisma.gameFile.create({
    data: {
      url: blob.url,
      platformId,
      gameId,
    },
  });

  return NextResponse.json(gameFile, { status: 201 });
}