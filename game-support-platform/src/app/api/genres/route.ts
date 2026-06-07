import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    include: { author: { select: { id: true, name: true } } }, // добавим информацию об авторе
  });
  return NextResponse.json(genres);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Название жанра обязательно' }, { status: 400 });
  }

  const existing = await prisma.genre.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: 'Жанр уже существует' }, { status: 400 });
  }

  const genre = await prisma.genre.create({
    data: {
      name: name.trim(),
      authorId: session.userId,   // сохраняем автора
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(genre, { status: 201 });
}