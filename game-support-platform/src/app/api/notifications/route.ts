import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

// непрочитанные (или все с параметром ?all=true)
export async function GET(request: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get('all') === 'true';
  
  const where: any = { userId: session.userId };
  if (!showAll) where.isRead = false;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(notifications);
}

// PATCH /api/notifications – пометить все как прочитанные (или конкретный id)
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id } = body || {};

  if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: session.userId },
      data: { isRead: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}