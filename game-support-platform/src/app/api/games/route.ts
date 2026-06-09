import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function GET() {
  const games = await prisma.game.findMany({
    include: {
      gameGenres: { include: { genre: true } },
      gamePlatforms: { include: { platform: true } },
      gameFiles: true,
      media: true,
      reviews: { select: { rating: true } },
      subscriptionTiers: { select: { price: true } },
      _count: { select: { reviews: true } },
    },
  });
  return NextResponse.json(games);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, genreIds, platformIds, mediaUrl, requiredTier } = body;

  if (!title) {
    return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
  }

  const game = await prisma.game.create({
    data: {
      title,
      description,
      mediaUrl,
      requiredTier: requiredTier || null,
      authorId: session.userId,
      gameGenres: {
        create: genreIds?.map((id: number) => ({ genre: { connect: { id: Number(id) } } })) || [],
      },
      gamePlatforms: {
        create: platformIds?.map((id: number) => ({ platform: { connect: { id: Number(id) } } })) || [],
      },
    },
    include: {
      gameGenres: { include: { genre: true } },
      gamePlatforms: { include: { platform: true } },
      gameFiles: true,
      media: true,
    },
  });

  // Уведомления подписчикам
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: session.userId },
      select: { followerId: true },
    });

    if (followers.length > 0) {
      const authorName = session.name || 'Разработчик';
      const notificationData = followers.map((f: { followerId: number }) => ({
        userId: f.followerId,
        type: 'new_game',
        message: `${authorName} выпустил(а) новую игру «${title}»`,
        relatedId: game.id,
      }));
      await prisma.notification.createMany({ data: notificationData });
    }
  } catch (error) {
    console.error('Ошибка создания уведомлений об игре:', error);
  }

  return NextResponse.json(game, { status: 201 });
}