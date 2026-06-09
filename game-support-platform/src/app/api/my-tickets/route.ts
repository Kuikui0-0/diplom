import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const where: any = {};
  // Если роль - пользователь, то показываем только его тикеты
  if (session.role === 'user') {
    where.authorId = session.userId;
  }
  // Разработчик или админ видят все, но можно добавить фильтр по статусу
  if (status && status !== 'all') {
    where.status = status;
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      game: { select: { title: true } },
      assignee: { select: { name: true } },
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(tickets);
}