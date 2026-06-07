import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import DeleteArticleButton from '@/components/DeleteArticleButton';
import EditArticleButton from '@/components/EditArticleButton';
import CommentSection from '@/components/CommentSection';
import GameGallery from '@/components/GameGallery';
import FollowButton from '@/components/FollowButton';

const prisma = new PrismaClient();

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ highlightComment?: string }>;
}) {
  const { id } = await params;
  const { highlightComment } = await searchParams;

  const article = await prisma.article.findUnique({
    where: { id: Number(id) },
    include: {
      game: { select: { title: true } },
      author: { select: { id: true, name: true, avatarUrl: true } },
      media: true,
    },
  });

  if (!article) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Статья не найдена</div>;
  }

  const sortedMedia = [...article.media].sort((a, b) => {
    if (a.type === 'video' && b.type !== 'video') return -1;
    if (a.type !== 'video' && b.type === 'video') return 1;
    return 0;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{article.title}</h1>
      {article.description && <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">{article.description}</p>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-full text-xs">
          {article.category}
        </span>
        {article.game?.title && (
          <span>🎮 {article.game.title}</span>
        )}
        <div className="flex items-center gap-1">
          Автор:
          <Link href={`/user/${article.author.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            {article.author.name}
          </Link>
          <FollowButton targetUserId={article.author.id} />
        </div>
      </div>

      <hr className="mb-6 border-gray-200 dark:border-gray-700" />

      {article.mediaUrl && sortedMedia.length === 0 && (
        <div className="mb-6 rounded-xl overflow-hidden">
          {article.mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
            <video src={article.mediaUrl} controls className="w-full max-h-96 object-contain bg-black" />
          ) : (
            <img src={article.mediaUrl} alt={article.title} className="w-full max-h-96 object-cover rounded-xl" />
          )}
        </div>
      )}

      {sortedMedia.length > 0 && <div className="mb-6"><GameGallery media={sortedMedia} /></div>}

      <div className="prose prose-indigo dark:prose-invert max-w-none mb-8 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
        {article.content}
      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        <EditArticleButton articleId={article.id} authorId={article.author.id} />
        <DeleteArticleButton articleId={article.id} authorId={article.author.id} />
      </div>

      <CommentSection
        articleId={article.id}
        highlightCommentId={highlightComment ? Number(highlightComment) : undefined}
      />

      <p className="mt-6">
        <Link href="/news" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">← К новостям</Link>
        <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
        <Link href="/guides" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">← К гайдам</Link>
      </p>
    </div>
  );
}