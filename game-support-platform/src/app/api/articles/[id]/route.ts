import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id: Number(id) },
    include: {
      game: { select: { title: true } },
      author: { select: { id: true, name: true, avatarUrl: true } },
      media: true,
    },
  });
  if (!article) return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 });
  return NextResponse.json(article);
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
  const articleId = Number(id);

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 });
  }

  if (session.userId !== article.authorId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, content, category, description, mediaUrl, subcategory } = body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (category !== undefined) data.category = category;
  if (description !== undefined) data.description = description;
  if (mediaUrl !== undefined) data.mediaUrl = mediaUrl;
  if (subcategory !== undefined) data.subcategory = subcategory;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Нет данных для обновления' }, { status: 400 });
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data,
    include: {
      game: { select: { title: true } },
      author: { select: { name: true } },
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
  const articleId = Number(id);

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { authorId: true },
  });

  if (!article) {
    return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 });
  }

  if (session.role !== 'admin' && session.userId !== article.authorId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.article.delete({ where: { id: articleId } });

  return NextResponse.json({ success: true });
}