import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import path from 'path';
import { mkdir, unlink, writeFile } from 'fs/promises';

const prisma = new PrismaClient();

// GET – получить информацию о сообщении (опционально)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const message = await prisma.message.findUnique({
    where: { id: Number(id) },
    include: {
      sender: { select: { id: true, name: true } },
      media: true,
    },
  });
  if (!message) return NextResponse.json({ error: 'Сообщение не найдено' }, { status: 404 });
  return NextResponse.json(message);
}

// PATCH – редактировать текст и медиа (уже есть, но оставьте как было)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const messageId = Number(id);

  const existingMessage = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true },
  });
  if (!existingMessage || existingMessage.senderId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const text = formData.get('text') as string || undefined;
    const removeMediaIdsStr = formData.get('removeMediaIds') as string || '[]';
    const removeMediaIds: number[] = JSON.parse(removeMediaIdsStr);
    const newFiles = formData.getAll('newFiles') as File[];

    // Удаление помеченных медиафайлов
    if (removeMediaIds.length > 0) {
      const mediaToRemove = await prisma.messageMedia.findMany({
        where: { id: { in: removeMediaIds }, messageId },
        select: { id: true, url: true },
      });
      for (const media of mediaToRemove) {
        try {
          const filePath = path.join(process.cwd(), 'public', media.url);
          await unlink(filePath);
        } catch (e) {}
      }
      await prisma.messageMedia.deleteMany({
        where: { id: { in: removeMediaIds }, messageId },
      });
    }

    // Загрузка новых файлов
    for (const file of newFiles) {
      if (file.size === 0) continue;
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), buffer);
      const url = `/uploads/${fileName}`;
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      await prisma.messageMedia.create({ data: { url, type, messageId } });
    }

    if (text !== undefined) {
      await prisma.message.update({
        where: { id: messageId },
        data: { text: text.trim() || null },
      });
    }

    const updatedMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true, name: true } },
        media: true,
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error: any) {
    console.error('Ошибка редактирования сообщения:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE – удалить сообщение (только своё)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const messageId = Number(id);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true },
  });

  if (!message) {
    return NextResponse.json({ error: 'Сообщение не найдено' }, { status: 404 });
  }

  if (message.senderId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.message.delete({ where: { id: messageId } });

  return NextResponse.json({ success: true });
}