import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });

  const session = await getSession();
  const userId = session.userId;

  const newsPosts = await prisma.newsPost.findMany({
    where: { gameId: Number(gameId) },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Если пользователь не подписан, скрываем содержимое эксклюзивных новостей
  let subscription = null;
  if (userId) {
    subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        tier: { gameId: Number(gameId) },
      },
    });
  }

  const result = newsPosts.map(post => {
    if (post.isExclusive && !subscription) {
      return {
        ...post,
        content: 'Эта новость доступна только подписчикам.',
      };
    }
    return post;
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId || session.role !== 'developer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, content, isExclusive, gameId } = await request.json();
  const post = await prisma.newsPost.create({
    data: {
      title,
      content,
      isExclusive: isExclusive || false,
      gameId: Number(gameId),
      authorId: session.userId,
      mediaUrl,
    },
  });
  return NextResponse.json(post, { status: 201 });
}