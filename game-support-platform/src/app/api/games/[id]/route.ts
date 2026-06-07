import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const game = await prisma.game.findUnique({
    where: { id: Number(id) },
    include: {
      gameGenres: { include: { genre: true } },
      gamePlatforms: { include: { platform: true } },
      gameFiles: true,
      media: true,
      author: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 });
  }

  return NextResponse.json(game);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const gameId = Number(id);

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 });

  if (session.role !== 'admin' && session.userId !== game.authorId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, genreIds, platformIds, mediaUrl, requiredTier } = body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (mediaUrl !== undefined) data.mediaUrl = mediaUrl;
  if (requiredTier !== undefined) data.requiredTier = requiredTier;

  // Обновление жанров
  if (genreIds) {
    await prisma.gameGenre.deleteMany({ where: { gameId } });
    if (genreIds.length > 0) {
      await prisma.gameGenre.createMany({
        data: genreIds.map((genreId: number) => ({
          gameId,
          genreId: Number(genreId),
        })),
      });
    }
  }

  // Обновление платформ
  if (platformIds) {
    await prisma.gamePlatform.deleteMany({ where: { gameId } });
    if (platformIds.length > 0) {
      await prisma.gamePlatform.createMany({
        data: platformIds.map((platformId: number) => ({
          gameId,
          platformId: Number(platformId),
        })),
      });
    }
  }

  if (Object.keys(data).length === 0 && !genreIds && !platformIds) {
    return NextResponse.json({ error: 'Нет данных для обновления' }, { status: 400 });
  }

  const updated = await prisma.game.update({
    where: { id: gameId },
    data,
    include: {
      gameGenres: { include: { genre: true } },
      gamePlatforms: { include: { platform: true } },
      gameFiles: true,
      media: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const gameId = Number(id);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { authorId: true },
  });

  if (!game) {
    return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 });
  }

  // Проверка прав
  const isAdmin = session.role === 'admin';
  const isAuthor = game.authorId !== null && game.authorId === session.userId;
  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 });
  }

  try {
    // Удаляем все зависимые данные в правильном порядке
    await prisma.gameReview.deleteMany({ where: { gameId } });
    await prisma.ticket.deleteMany({ where: { gameId } });
    await prisma.newsPost.deleteMany({ where: { gameId } });
    await prisma.gameFile.deleteMany({ where: { gameId } });
    await prisma.gameMedia.deleteMany({ where: { gameId } });
    await prisma.subscriptionTier.deleteMany({ where: { gameId } });
    await prisma.gameGenre.deleteMany({ where: { gameId } });
    await prisma.gamePlatform.deleteMany({ where: { gameId } });
    // Для статей – отвязываем игру (если нужно, можно удалить, но обычно статьи остаются)
    await prisma.article.updateMany({
      where: { gameId },
      data: { gameId: null },
    });

    // Теперь удаляем саму игру
    await prisma.game.delete({ where: { id: gameId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка удаления игры:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}