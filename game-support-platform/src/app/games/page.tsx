import { PrismaClient } from '@prisma/client';
import GameCard from '@/components/GameCard';
import CreateGameForm from '@/components/CreateGameForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; genre?: string }>;
}) {
  const { search = '', genre = '' } = await searchParams;

  const where: any = {};
  if (search) where.title = { contains: search };
  if (genre) {
    where.gameGenres = {
      some: {
        genreId: Number(genre),
      },
    };
  }

  const games = await prisma.game.findMany({
    where,
    include: {
      reviews: { select: { rating: true } },
      subscriptionTiers: { select: { price: true } },
      gameGenres: { include: { genre: true } },
      media: { select: { url: true, type: true } },
      gamePlatforms: { include: { platform: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const gamesWithStats = games.map((game: any) => {
    const ratings = game.reviews.map((r: any) => r.rating);
    const avgRating = ratings.length
      ? ratings.reduce((a: any, b: any) => a + b, 0) / ratings.length
      : 0;
    const prices = game.subscriptionTiers.map((t: any) => t.price);
    const minPrice = prices.length ? Math.min(...prices) : null;

    const sortedMedia = [...game.media].sort((a: any, b: any) => {
      if (a.type === 'video' && b.type !== 'video') return -1;
      if (a.type !== 'video' && b.type === 'video') return 1;
      return 0;
    });
    const firstMedia = sortedMedia[0];
    const iconUrl = game.mediaUrl || firstMedia?.url || null;

    const genreNames = game.gameGenres.map((gg: any) => gg.genre.name).join(', ');

    return {
      id: game.id,
      title: game.title,
      genre: genreNames || null,
      iconUrl,
      averageRating: avgRating,
      reviewCount: game._count.reviews,
      minSubscriptionPrice: minPrice,
      platforms: game.gamePlatforms.map((gp: any) => ({ name: gp.platform.name })),
    };
  });

  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">🎮 Игры студии</h1>

      <form method="GET" className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          name="search"
          placeholder="Поиск по названию..."
          defaultValue={search}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select name="genre" defaultValue={genre} className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2">
          <option value="">Все жанры</option>
          {genres.map((g: any) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          🔍 Искать
        </button>
        <Link href="/games" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          Сбросить
        </Link>
      </form>

      {games.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Игр не найдено.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gamesWithStats.map((game: any) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      )}

      <div className="mt-12">
        <CreateGameForm />qsqsqsqs
      </div>
    </div>
  );
}