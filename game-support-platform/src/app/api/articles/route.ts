import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { Follow } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  const where = gameId ? { gameId: Number(gameId) } : {};

  const articles = await prisma.article.findMany({
    where,
    include: {
      game: { select: { title: true } },
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let title: string, content: string, category: string, gameId: number | null;
  let description: string | undefined;
  let mediaUrl: string | undefined;
  let subcategory: string | undefined;

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    title = body.title;
    content = body.content;
    category = body.category || 'news';
    gameId = body.gameId !== undefined && body.gameId !== null ? Number(body.gameId) : null;
    description = body.description || undefined;
    mediaUrl = body.mediaUrl || undefined;
    subcategory = body.subcategory || undefined;
  } else {
    const formData = await request.formData();
    title = formData.get('title') as string;
    content = formData.get('content') as string;
    category = (formData.get('category') as string) || 'news';
    gameId = formData.get('gameId') ? Number(formData.get('gameId')) : null;
    description = (formData.get('description') as string) || undefined;
    mediaUrl = (formData.get('mediaUrl') as string) || undefined;
    subcategory = (formData.get('subcategory') as string) || undefined;
  }

  if (!title || !content) {
    return NextResponse.json({ error: 'Заголовок и содержание обязательны' }, { status: 400 });
  }

  const article = await prisma.article.create({
    data: {
      title,
      content,
      category,
      gameId,
      authorId: session.userId,
      description,
      mediaUrl,
      subcategory,
    },
  });

  // --- Уведомления подписчикам ---
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: session.userId },
      select: { followerId: true },
    });

    if (followers.length > 0) {
      const authorName = session.name || 'Автор';
      const notificationData = followers.map((f) => ({
        userId: f.followerId,
        type: 'new_article',
        message: `${authorName} опубликовал(а) новую статью «${title}»`,
        relatedId: article.id,
      }));

      await prisma.notification.createMany({ data: notificationData });
    }
  } catch (error) {
    console.error('Ошибка создания уведомлений о статье:', error);
  }
  // ---------------------------------

  return NextResponse.json(article, { status: 201 });
}