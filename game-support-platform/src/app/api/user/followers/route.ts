import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const followers = await prisma.follow.findMany({
    where: { followingId: session.userId },
    include: {
      follower: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const list = followers.map((f: { follower: { id: number; name: string; avatarUrl: string | null } }) => f.follower);
  return NextResponse.json(list);
}