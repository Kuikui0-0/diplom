import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        showFollowers: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        showFollowers: user.showFollowers,
      },
    });
  } catch (error) {
    console.error('Ошибка в /api/auth/me:', error);
    return NextResponse.json({ user: null });   // важно: всегда JSON
  }
}