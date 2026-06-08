import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Conversation, User, Message } from '@prisma/client';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: session.userId },
        { user2Id: session.userId },
      ],
    },
    include: {
      user1: { select: { id: true, name: true, avatarUrl: true } },
      user2: { select: { id: true, name: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  // Для каждого диалога считаем непрочитанные
  const result = await Promise.all(
  conversations.map(async (conv: Conversation & {
    user1: Pick<User, 'id' | 'name' | 'avatarUrl'>;
    user2: Pick<User, 'id' | 'name' | 'avatarUrl'>;
    messages: Message[];
    _count: { messages: number };
  }) => {
      const partner = conv.user1Id === session.userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0] || null;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          isRead: false,
          senderId: { not: session.userId },
        },
      });

      return {
        id: conv.id,
        partner,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              createdAt: lastMessage.createdAt,
              isMine: lastMessage.senderId === session.userId,
            }
          : null,
        unreadCount,
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    const { partnerId, text } = body;

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId обязателен' }, { status: 400 });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: session.userId, user2Id: partnerId },
          { user1Id: partnerId, user2Id: session.userId },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: session.userId,
          user2Id: partnerId,
        },
      });
    }

    if (text && text.trim()) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.userId,
          text: text.trim(),
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    return NextResponse.json({ id: conversation.id });
  }

  // FormData для обычной отправки
  const formData = await request.formData();
  const partnerId = Number(formData.get('partnerId'));
  const text = formData.get('text') as string || '';
  const files = formData.getAll('files') as File[];

  if (!partnerId || (!text.trim() && files.length === 0)) {
    return NextResponse.json({ error: 'partnerId и текст/файлы обязательны' }, { status: 400 });
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: session.userId, user2Id: partnerId },
        { user1Id: partnerId, user2Id: session.userId },
      ],
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        user1Id: session.userId,
        user2Id: partnerId,
      },
    });
  }

  const mediaData: { url: string; type: string }[] = [];
  for (const file of files) {
    if (file.size === 0) continue;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, fileName), buffer);
    const url = `/uploads/${fileName}`;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    mediaData.push({ url, type });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session.userId,
      text: text.trim() || null,
      media: { create: mediaData },
    },
    include: {
      sender: { select: { id: true, name: true } },
      media: true,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  // Уведомление получателю
  await prisma.notification.create({
    data: {
      userId: partnerId,
      type: 'new_message',
      message: `Новое сообщение от ${session.name || 'пользователя'}`,
      relatedId: conversation.id,
    },
  });

  return NextResponse.json(message, { status: 201 });
}