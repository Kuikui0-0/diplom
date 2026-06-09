import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Неверный ID пользователя' }, { status: 400 });
  }

  try {
    // Отвязываем игры, созданные пользователем (чтобы не удалились каскадно)
    await prisma.game.updateMany({
      where: { authorId: userId },
      data: { authorId: null },
    });

    // Удаляем пользователя (каскадно удалятся все его тикеты, комментарии, подписки и т.д.)
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ошибка удаления пользователя:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}