import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  // Исправленная проверка роли (было !session.role !== 'developer' – ошибка)
  if (!session.userId || (session.role !== 'developer' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const gameId = Number(id);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  const type = file.type.startsWith('video') ? 'video' : 'image';

  // Загружаем в Vercel Blob
  const blob = await put(`games/${gameId}/${Date.now()}-${file.name}`, file, { access: 'public' });

  const media = await prisma.gameMedia.create({
    data: {
      gameId,
      url: blob.url,
      type,
    },
  });

  return NextResponse.json({ media }, { status: 201 });
}