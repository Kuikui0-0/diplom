import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, fileId } = await params;
  const gameId = Number(id);

  // Проверка прав
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { authorId: true },
  });
  if (!game || (session.role !== 'admin' && session.userId !== game.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Находим файл в БД
  const file = await prisma.gameFile.findUnique({
    where: { id: Number(fileId) },
  });
  if (!file || file.gameId !== gameId) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }

  // Удаляем файл из Blob Storage
  try {
    await del(file.url);
  } catch (e) {
    // Если файл уже удалён или ошибка – игнорируем
    console.warn('Ошибка удаления файла из Blob:', e);
  }

  // Удаляем запись из базы данных
  await prisma.gameFile.delete({ where: { id: Number(fileId) } });

  return NextResponse.json({ success: true });
}