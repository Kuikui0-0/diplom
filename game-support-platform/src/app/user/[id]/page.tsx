import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import FollowButton from '@/components/FollowButton';
import ExistingChatButton from '@/components/ExistingChatButton';
import { getRoleLabel } from '@/lib/roles';

export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);
  const session = await getSession();

  // Если смотрим свой профиль — редирект на личный кабинет
  if (session?.userId && session.userId.toString() === id) {
    redirect('/profile');
  }

  const isOwnerOrAdmin = session?.userId === userId || session?.role === 'admin';

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      avatarUrl: true,
      lastSeenAt: true,
      showFollowers: true,
      _count: {
        select: {
          articles: true,
          comments: true,
          tickets: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Пользователь не найден</div>;
  }

  let followersList: any[] = [];
  let followingList: any[] = [];
  if (isOwnerOrAdmin) {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, name: true, avatarUrl: true } } },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    followersList = followers.map((f: any) => f.follower);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, name: true, avatarUrl: true } } },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    followingList = following.map((f: any) => f.following);
  }

  const isOnline =
    user.lastSeenAt &&
    new Date().getTime() - new Date(user.lastSeenAt).getTime() < 5 * 60 * 1000;
  const statusText = isOnline ? '🟢 В сети' : '⚫ Не в сети';
  const lastSeenInfo = user.lastSeenAt
    ? `Был(а) в сети: ${new Date(user.lastSeenAt).toLocaleString()}`
    : '';

  const recentArticles = await prisma.article.findMany({
    where: { authorId: userId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true },
  });

  let recentComments: any[] = [];
  let recentTickets: any[] = [];
  if (isOwnerOrAdmin) {
    recentComments = await prisma.comment.findMany({
      where: { authorId: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        article: { select: { id: true, title: true } },
      },
    });

    recentTickets = await prisma.ticket.findMany({
      where: { authorId: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true },
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Шапка профиля */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl font-bold text-gray-400 dark:text-gray-500">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
          {user.role !== 'user' && <p className="text-gray-500 dark:text-gray-400 mt-1">Роль: {getRoleLabel(user.role)}</p>}
          <p className="text-gray-600 dark:text-gray-300 mt-1">{statusText}</p>
          {isOwnerOrAdmin && lastSeenInfo && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{lastSeenInfo}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Статей: {user._count.articles}</span>
            {isOwnerOrAdmin && (
              <>
                <span>Комментариев: {user._count.comments}</span>
                <span>Тикетов: {user._count.tickets}</span>
              </>
            )}
            {isOwnerOrAdmin ? (
              <>
                <span>Подписчиков: {user._count.followers}</span>
                <span>Подписок: {user._count.following}</span>
              </>
            ) : (
              <span>Подписчиков: {user._count.followers}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <FollowButton targetUserId={user.id} />
            {session?.userId !== userId && <ExistingChatButton targetUserId={user.id} />}
          </div>
        </div>
      </div>

      <hr className="my-6 dark:border-gray-700" />

      {/* Подписчики и подписки (только для владельца/админа) */}
      {(user.showFollowers || isOwnerOrAdmin) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Подписчики ({followersList.length})</h2>
            {followersList.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Нет подписчиков</p>
            ) : (
              <ul className="space-y-2">
                {followersList.map((follower: any) => (
                  <li key={follower.id} className="flex items-center gap-3">
                    {follower.avatarUrl ? (
                      <img src={follower.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                        {follower.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <Link href={`/user/${follower.id}`} className="text-sm text-gray-800 dark:text-gray-200 hover:underline">
                      {follower.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Подписки ({followingList.length})</h2>
            {followingList.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Нет подписок</p>
            ) : (
              <ul className="space-y-2">
                {followingList.map((following: any) => (
                  <li key={following.id} className="flex items-center gap-3">
                    {following.avatarUrl ? (
                      <img src={following.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                        {following.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <Link href={`/user/${following.id}`} className="text-sm text-gray-800 dark:text-gray-200 hover:underline">
                      {following.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <hr className="my-6 dark:border-gray-700" />

      {/* Последние статьи */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Последние статьи</h2>
      {recentArticles.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Пока нет статей.</p>}
      <ul className="space-y-1 mb-6">
        {recentArticles.map((article: any) => (
          <li key={article.id}>
            <Link href={`/knowledge/${article.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
              {article.title}
            </Link>
          </li>
        ))}
      </ul>

      {/* Приватные разделы (владелец/админ) */}
      {isOwnerOrAdmin && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Последние комментарии</h2>
          {recentComments.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Пока нет комментариев.</p>}
          <ul className="space-y-2 mb-6">
            {recentComments.map((comment: any) => (
              <li key={comment.id} className="text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-400 dark:text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>: {comment.content.substring(0, 80)}...
                {comment.article && (
                  <span>
                    {' '}
                    (<Link href={`/knowledge/${comment.article.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      {comment.article.title}
                    </Link>)
                  </span>
                )}
              </li>
            ))}
          </ul>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Последние тикеты</h2>
          {recentTickets.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Пока нет тикетов.</p>}
          <ul className="space-y-1 mb-6">
            {recentTickets.map((ticket: any) => (
              <li key={ticket.id} className="text-sm text-gray-700 dark:text-gray-300">
                #{ticket.id} {ticket.title} <span className="text-gray-400 dark:text-gray-500">({ticket.status})</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4">
        <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
          ← На главную
        </Link>
      </p>
    </div>
  );
}