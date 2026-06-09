import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

export async function GET() {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(platforms);
}