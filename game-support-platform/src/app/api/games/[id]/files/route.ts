import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const gameId = Number(id);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { authorId: true },
  });
  if (!game || (session.role !== 'admin' && session.userId !== game.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const platformId = Number(formData.get('platformId'));

  if (!file || !platformId) {
    return NextResponse.json({ error: 'Файл и платформа обязательны' }, { status: 400 });
  }

  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  const url = `/uploads/${fileName}`;

  // Удаляем старый файл для этой платформы, если есть
  const existing = await prisma.gameFile.findFirst({
    where: { gameId, platformId },
  });
  if (existing) {
    await prisma.gameFile.delete({ where: { id: existing.id } });
  }

  const gameFile = await prisma.gameFile.create({
    data: {
      url,
      platformId,
      gameId,
    },
  });

  return NextResponse.json(gameFile, { status: 201 });
}