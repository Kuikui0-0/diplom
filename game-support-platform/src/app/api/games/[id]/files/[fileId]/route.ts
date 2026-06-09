import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { unlink } from 'fs/promises';
import path from 'path';

import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, fileId } = await params;
  const gameId = Number(id);

  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { authorId: true } });
  if (!game || (session.role !== 'admin' && session.userId !== game.authorId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const file = await prisma.gameFile.findUnique({ where: { id: Number(fileId) } });
  if (!file || file.gameId !== gameId) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'public', file.url);
  try { await unlink(filePath); } catch (e) {}

  await prisma.gameFile.delete({ where: { id: Number(fileId) } });
  return NextResponse.json({ success: true });
}