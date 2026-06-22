import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

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

  // Проверяем, существует ли статья и имеет ли пользователь права
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { authorId: true },
  });
  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }
  if (article.authorId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Определяем тип медиа
  const type = file.type.startsWith('video') ? 'video' : 'image';

  // Загружаем в Vercel Blob
  const blob = await put(`articles/${articleId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  // Сохраняем запись в базе данных
  const media = await prisma.articleMedia.create({
    data: {
      articleId,
      url: blob.url,
      type,
    },
  });

  return NextResponse.json(media, { status: 201 });
}