import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id: Number(id) },
    select: { id: true, articleId: true },
  });
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(comment);
}