import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = Number(id);

  const comments = await prisma.comment.findMany({
    where: { articleId },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const articleId = Number(id);

  const body = await request.json();
  const { content, parentId } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Комментарий не может быть пустым' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      articleId,
      authorId: session.userId,
      parentId: parentId ? Number(parentId) : null,
    },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Создаём уведомление автору родительского комментария, если ответил кто-то другой
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({ where: { id: Number(parentId) } });
    if (parentComment && parentComment.authorId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: parentComment.authorId,
          type: 'comment_reply',
          message: `${session.name || 'Пользователь'} ответил на ваш комментарий`,
          relatedId: parentComment.id,
        },
      });
    }
  }

  return NextResponse.json(comment, { status: 201 });
}