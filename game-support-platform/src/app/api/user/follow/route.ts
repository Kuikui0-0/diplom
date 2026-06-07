import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId || targetUserId === session.userId) {
      return NextResponse.json({ error: 'Недопустимый пользователь' }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.userId,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    } else {
      await prisma.follow.create({
        data: {
          followerId: session.userId,
          followingId: targetUserId,
        },
      });
      return NextResponse.json({ following: true });
    }
  } catch (error: any) {
    console.error('Follow API error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ following: false });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = Number(searchParams.get('targetUserId'));
    if (!targetUserId) {
      return NextResponse.json({ following: false });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.userId,
          followingId: targetUserId,
        },
      },
    });

    return NextResponse.json({ following: !!follow });
  } catch (error) {
    console.error('Follow check error:', error);
    return NextResponse.json({ following: false });
  }
}