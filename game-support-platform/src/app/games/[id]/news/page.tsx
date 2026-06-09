import CreateNewsForm from '@/components/CreateNewsForm';
import { PrismaClient, NewsPost } from '@prisma/client';
import Link from 'next/link';
import { getSession } from '@/lib/session';

import prisma from '@/lib/prisma';

export default async function GameNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return <div className="p-8 text-center text-gray-500">Игра не найдена</div>;

  const session = await getSession();
  const userId = session?.userId;
  const isOwnerOrAdmin = session?.userId === game.authorId || session?.role === 'admin';

  const newsPosts = await prisma.newsPost.findMany({
    where: { gameId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  let hasSubscription = false;
  if (userId) {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: 'active', tier: { gameId } },
    });
    hasSubscription = !!sub;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        📰 Новости игры «{game.title}»
      </h1>
      <Link
        href={`/games/${game.id}`}
        className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-6 inline-block"
      >
        ← Назад к игре
      </Link>

      {/* Список существующих новостей */}
      {newsPosts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 mb-8">Новостей пока нет.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {newsPosts.map((post: NewsPost & { author: { name: string } }) => {
  const isLocked = post.isExclusive && !hasSubscription;
  return  (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="flex h-full">
                  {/* Левая часть — обложка или placeholder */}
                  <div className="w-32 sm:w-40 bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
                    {post.mediaUrl ? (
                      <img
                        src={post.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Новости</span>
                    )}
                  </div>

                  {/* Правая часть — контент */}
                  <div className="flex-1 p-4 flex flex-col">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {isLocked ? '🔒 Эта новость доступна только подписчикам.' : post.content}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {post.author?.name?.charAt(0) || 'N'}
                      </span>
                      <span>{post.author?.name || 'Неизвестно'}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    {isLocked && (
                      <Link
                        href={`/games/${game.id}/subscribe`}
                        className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Оформить подписку
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Форма создания — только для автора/админа */}
      {isOwnerOrAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Добавить новость
          </h2>
          <CreateNewsForm gameId={game.id} />
        </div>
      )}
    </div>
  );
}