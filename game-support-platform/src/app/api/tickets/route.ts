import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let title: string, description: string, type: string, gameId: number;

  const contentType = request.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const body = await request.json();
    title = body.title;
    description = body.description;
    type = body.type || 'bug';
    gameId = Number(body.gameId);
  } else {
    const formData = await request.formData();
    title = formData.get('title') as string;
    description = formData.get('description') as string;
    type = (formData.get('type') as string) || 'bug';
    gameId = Number(formData.get('gameId'));
  }

  if (!title || !description || !gameId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        type,
        gameId,
        authorId: session.userId,
      },
    });

    // Уведомление разработчику игры (если есть автор и это не он сам)
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { authorId: true, title: true },
    });

    if (game && game.authorId && game.authorId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: game.authorId,
          type: 'new_ticket',
          message: `Новый тикет «${title}» в игре «${game.title}»`,
          relatedId: ticket.id,
        },
      });
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error('Ошибка создания тикета:', error);
    return NextResponse.json({ error: 'Ошибка сервера: ' + error.message }, { status: 500 });
  }
}