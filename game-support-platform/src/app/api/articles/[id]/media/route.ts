import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

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

  // Проверим, что пользователь имеет право редактировать эту статью (автор или админ)
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { authorId: true },
  });
  if (!article) return NextResponse.json({ error: 'Статья не найдена' }, { status: 404 });
  if (session.role !== 'admin' && session.userId !== article.authorId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
  }

  const type = file.type.startsWith('video/') ? 'video' : 'image';
  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  const url = `/uploads/${fileName}`;

  const media = await prisma.articleMedia.create({
    data: {
      articleId,
      url,
      type,
    },
  });

  return NextResponse.json(media, { status: 201 });
}