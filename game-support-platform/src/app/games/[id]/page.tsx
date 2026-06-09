import Link from 'next/link';
import DeleteGameButton from '@/components/DeleteGameButton';
import EditGameButton from '@/components/EditGameButton';
import GameReviewsSection from '@/components/GameReviewsSection';
import TicketSection from '@/components/TicketSection';
import GameGallery from '@/components/GameGallery';
import SubscribeButton from '@/components/SubscribeButton';
import FollowButton from '@/components/FollowButton';
import { getSession } from '@/lib/session';
import GameUpdates from '@/components/GameUpdates';
import prisma from '@/lib/prisma'; // глобальный синглтон

export const dynamic = 'force-dynamic';

const tierRank: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  const session = await getSession();

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      tickets: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { reviews: true } },
      gameGenres: { include: { genre: true } },
      gamePlatforms: { include: { platform: true } },
      gameFiles: true,
      media: true,
      author: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  if (!game) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Игра не найдена</div>;
  }

  // Проверка на 18+
  const hasAdultGenre = game.gameGenres.some((gg: any) => gg.genre.name === '18+');
  const userAge = session?.age;
  const adultBlocked = hasAdultGenre && (userAge === undefined || userAge < 18);

  const isAuthor = session?.userId === game.authorId;
  const isOwnerOrAdmin = isAuthor || session?.role === 'admin';

  let hasAuthorSubscription = false;
  if (session?.userId && game.author && !isAuthor) {
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: session.userId,
        followingId: game.author.id,
      },
    });
    hasAuthorSubscription = !!follow;
  }

  let userMaxTier: string | null = null;
  if (session?.userId && game.requiredTier && !adultBlocked) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.userId,
        status: 'active',
        tier: { gameId: game.id },
      },
      include: { tier: { select: { name: true } } },
    });
    if (subscription) {
      userMaxTier = subscription.tier.name;
    }
  }

  const requiredRank = game.requiredTier ? (tierRank[game.requiredTier] || 0) : 0;
  const userRank = userMaxTier ? (tierRank[userMaxTier] || 0) : 0;
  const hasGameSubscription = userRank >= requiredRank;

  const hasFullAccess =
    !adultBlocked &&
    (isAuthor ||
      session?.role === 'admin' ||
      !game.requiredTier ||
      hasGameSubscription ||
      hasAuthorSubscription);

  // Тикеты: фильтрация и преобразование
  let visibleTickets = game.tickets;
  if (hasFullAccess) {
    if (session?.userId) {
      const isDeveloper = isAuthor;
      const isAdmin = session.role === 'admin';
      if (!isDeveloper && !isAdmin) {
        visibleTickets = game.tickets.filter((t: any) => t.authorId === session.userId);
      } else {
        visibleTickets = game.tickets;
      }
    } else {
      visibleTickets = [];
    }
  } else {
    visibleTickets = [];
  }

  const ticketsForComponent = visibleTickets.map((ticket: any) => ({
    ...ticket,
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
  }));

  // Медиа
  const sortedMedia = [...game.media].sort((a: any, b: any) => {
    if (a.type === 'video' && b.type !== 'video') return -1;
    if (a.type !== 'video' && b.type === 'video') return 1;
    return 0;
  });

  const iconUrl = game.mediaUrl || sortedMedia[0]?.url || null;
  const genreNames = game.gameGenres.map((gg: any) => gg.genre.name).join(', ');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {adultBlocked ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-6 rounded-xl text-center">
          <p className="text-lg font-medium">Вам должно быть 18 лет, чтобы просматривать эту игру.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {iconUrl ? (
                <img src={iconUrl} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-4xl font-bold text-gray-400 dark:text-gray-500">
                  {game.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{game.title}</h1>
              {genreNames && <p className="text-gray-500 dark:text-gray-400 mt-1">{genreNames}</p>}
              {game.author && (
                <div className="flex items-center gap-2 mt-2">
                  {/* Аватар автора */}
                  {game.author.avatarUrl ? (
                    <img src={game.author.avatarUrl} alt={game.author.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                      {game.author.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-gray-600 dark:text-gray-400">Автор:</span>
                  <Link href={`/user/${game.author.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    {game.author.name}
                  </Link>
                  {!isAuthor && <FollowButton targetUserId={game.author.id} />}
                </div>
              )}
              <p className="text-gray-700 dark:text-gray-300 mt-2">{game.description}</p>
              {game.gamePlatforms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {game.gamePlatforms.map((gp: any) => (
                    <span key={gp.platform.id} className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                      {gp.platform.name === 'Android' ? '📱' : '💻'} {gp.platform.name}
                    </span>
                  ))}
                </div>
              )}
              {game.requiredTier && (
                <p className="mt-3 text-amber-700 dark:text-amber-400 font-medium">
                  Требуется подписка: <strong>{game.requiredTier}</strong>
                </p>
              )}
              {!hasFullAccess && game.requiredTier && (
                <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                  <p className="text-amber-800 dark:text-amber-400">
                    Для доступа к полному контенту требуется подписка уровня <strong>{game.requiredTier}</strong>.
                  </p>
                  <div className="mt-2">
                    <SubscribeButton gameId={game.id} authorId={game.authorId} />
                  </div>
                </div>
              )}
              {hasFullAccess && game.gameFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {game.gameFiles.map((file: any) => (
                    <a
                      key={file.id}
                      href={file.url}
                      download
                      className="inline-flex items-center gap-1 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
                    >
                      📥 Скачать для {file.platformId === 1 ? 'Android' : 'PC'}
                    </a>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <EditGameButton gameId={game.id} authorId={game.authorId} />
                <DeleteGameButton gameId={game.id} authorId={game.authorId} />
              </div>
            </div>
          </div>

          {hasFullAccess ? (
            <>
              {sortedMedia.length > 0 && <GameGallery media={sortedMedia} />}
              <TicketSection tickets={ticketsForComponent} gameId={game.id} />
              <GameUpdates gameId={game.id} isOwnerOrAdmin={isOwnerOrAdmin} />
              <GameReviewsSection gameId={game.id} />
            </>
          ) : (
            <div className="mt-8 text-gray-500 dark:text-gray-400">
              <p>Контент доступен только подписчикам уровня {game.requiredTier}</p>
            </div>
          )}

          <p className="mt-8">
            <Link href="/games" className="text-indigo-600 dark:text-indigo-400 hover:underline">← Все игры</Link>
          </p>
        </>
      )}
    </div>
  );
}