import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default function KnowledgeRedirect() {
  redirect('/news');
}