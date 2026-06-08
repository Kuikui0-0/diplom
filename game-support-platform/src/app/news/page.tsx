import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import ArticleCard from '@/components/ArticleCard';
import CreateArticleForm from '@/components/CreateArticleForm';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search = '', category = '' } = await searchParams;
  const session = await getSession();

  const where: any = { category: { in: ['news', 'game_news'] } };
  if (search) where.title = { contains: search };

  if (category === 'news') {
    where.category = 'news';
  } else if (category === 'game_news') {
    where.category = 'game_news';
  } else if (category === 'favorites') {
    if (session.userId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: session.userId },
        select: { followingId: true },
      });
      const followingIds = follows.map((f: any) => f.followingId);
      where.authorId = { in: followingIds };
    } else {
      where.authorId = { in: [] };
    }
  }

  const articles = await prisma.article.findMany({
    where,
    include: {
      game: { select: { title: true } },
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">📰 Новости</h1>

      <form method="GET" className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          name="search"
          placeholder="Поиск по заголовку..."
          defaultValue={search}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select name="category" defaultValue={category} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2">
          <option value="">Выберите категорию</option>
          <option value="news">Общие новости</option>
          <option value="game_news">Новости мира игр</option>
          <option value="favorites">Новости моих фаворитов</option>
        </select>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          🔍 Искать
        </button>
        <Link href="/news" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          Сбросить
        </Link>
      </form>

      {articles.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Новостей не найдено.</p>
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
              gameTitle={article.game?.title}
              author={article.author}
              mediaUrl={article.mediaUrl}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <CreateArticleForm defaultCategory="news" />
      </div>
    </div>
  );
}