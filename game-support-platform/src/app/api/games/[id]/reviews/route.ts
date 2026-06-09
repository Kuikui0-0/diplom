import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

// GET — получить отзывы для игры
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);

  const reviews = await prisma.gameReview.findMany({
    where: { gameId },
    include: {
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // вычислим средний рейтинг
  const stats = await prisma.gameReview.aggregate({
    where: { gameId },
    _avg: { rating: true },
    _count: true,
  });

  return NextResponse.json({
    reviews,
    average: stats._avg.rating?.toFixed(1) || '0',
    count: stats._count,
  });
}

// POST — создать или обновить свой отзыв
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const gameId = Number(id);

  const body = await request.json();
  const { rating, content } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Оценка должна быть от 1 до 5' }, { status: 400 });
  }

  // Ищем существующий отзыв пользователя
  const existing = await prisma.gameReview.findUnique({
    where: { gameId_authorId: { gameId, authorId: session.userId } },
  });

  if (existing) {
    // обновляем
    const updated = await prisma.gameReview.update({
      where: { id: existing.id },
      data: { rating, content: content || undefined },
      include: { author: { select: { id: true, name: true } } },
    });
    return NextResponse.json(updated);
  }

  // создаём новый
  const review = await prisma.gameReview.create({
    data: {
      rating,
      content: content || undefined,
      gameId,
      authorId: session.userId,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(review, { status: 201 });
}