// src/app/api/messages/conversation/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// GET – получить сообщения диалога
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = Number(id);

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { user1Id: true, user2Id: true },
  });
  if (!conv || (conv.user1Id !== session.userId && conv.user2Id !== session.userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Помечаем все сообщения собеседника как прочитанные
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      media: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(messages);
}

// PATCH – очистить или удалить диалог
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = Number(id);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { user1Id: true, user2Id: true, deletedByUser1: true, deletedByUser2: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });
  }

  const isUser1 = session.userId === conversation.user1Id;
  const isUser2 = session.userId === conversation.user2Id;
  if (!isUser1 && !isUser2) {
    return NextResponse.json({ error: 'Вы не участник этого диалога' }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'delete') {
    // Если диалог с самим собой – удаляем физически
    if (conversation.user1Id === conversation.user2Id) {
      await prisma.conversation.delete({ where: { id: conversationId } });
      return NextResponse.json({ deleted: true, allDeleted: true });
    }

    // Устанавливаем флаг удаления для текущего пользователя
    if (isUser1) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { deletedByUser1: true },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { deletedByUser2: true },
      });
    }

    const updated = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { deletedByUser1: true, deletedByUser2: true },
    });

    if (updated?.deletedByUser1 && updated?.deletedByUser2) {
      await prisma.conversation.delete({ where: { id: conversationId } });
      return NextResponse.json({ deleted: true, allDeleted: true });
    }

    return NextResponse.json({ deleted: true });
  }

  if (action === 'clear') {
    await prisma.message.deleteMany({ where: { conversationId } });
    return NextResponse.json({ cleared: true });
  }

  return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
}