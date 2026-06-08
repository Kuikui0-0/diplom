import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session'; // Обратите внимание на @/lib/session (или @lib/session — уточните путь)

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  
  // Исправленное условие: проверяем, что пользователь авторизован и его роль developer или admin
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Явно указываем тип для g, чтобы избежать ошибки implicit any
  const developerGames = await prisma.game.findMany({
    where: { authorId: session.userId },
    select: { id: true },
  });

  // Здесь g автоматически выводится как { id: number } благодаря select
  const gameIds = developerGames.map((g: { id: number }) => g.id);

  const tickets = await prisma.ticket.findMany({
    where: { gameId: { in: gameIds } },
    include: {
      game: { select: { title: true } },
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(tickets);
}