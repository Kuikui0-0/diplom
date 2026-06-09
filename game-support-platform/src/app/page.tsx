import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function Home() {
  const session = await getSession();
  if (session.userId) {
    redirect('/games');
  }
  redirect('/login');
}