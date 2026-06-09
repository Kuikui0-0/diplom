import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import ArticleCard from '@/components/ArticleCard';
import CreateArticleForm from '@/components/CreateArticleForm';


export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; subcategory?: string }>;
}) {
  const { search = '', subcategory = '' } = await searchParams;

  const where: any = { category: 'guide' };
  if (search) where.title = { contains: search };
  if (subcategory) where.subcategory = subcategory;

  const articles = await prisma.article.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">📘 Гайды</h1>

      <form method="GET" className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          name="search"
          placeholder="Поиск по заголовку..."
          defaultValue={search}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select name="subcategory" defaultValue={subcategory} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2">
          <option value="">Выберите категорию</option>
          <option value="engine">Движки</option>
          <option value="mechanics">Механики</option>
          <option value="assets">Ассеты / Арты</option>
        </select>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          🔍 Искать
        </button>
        <Link href="/guides" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          Сбросить
        </Link>
      </form>

      {articles.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Гайдов не найдено.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {articles.map((article: any) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              description={article.description}
              category={article.category}
              subcategory={article.subcategory}
              author={article.author}
              mediaUrl={article.mediaUrl}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <CreateArticleForm defaultCategory="guide" />
      </div>
    </div>
  );
}