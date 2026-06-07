import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(platforms);
}