import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const genreId = Number(id);

  const genre = await prisma.genre.findUnique({
    where: { id: genreId },
    select: { authorId: true },
  });

  if (!genre) {
    return NextResponse.json({ error: 'Жанр не найден' }, { status: 404 });
  }

  // Только автор или админ
  if (session.role !== 'admin' && session.userId !== genre.authorId) {
    return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 });
  }

  // Проверим, есть ли игры с этим жанром
  const gamesCount = await prisma.gameGenre.count({ where: { genreId } });
  if (gamesCount > 0) {
    return NextResponse.json({ error: 'Невозможно удалить жанр, так как есть игры с этим жанром' }, { status: 400 });
  }

  await prisma.genre.delete({ where: { id: genreId } });
  return NextResponse.json({ success: true });
}