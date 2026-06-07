import Link from 'next/link';

interface Author {
  id: number;
  name: string;
  avatarUrl?: string | null;
}

interface ArticleCardProps {
  id: number;
  title: string;
  description?: string | null;
  category?: string;
  subcategory?: string | null;
  gameTitle?: string | null;
  author: Author;
  mediaUrl?: string | null;
}

export default function ArticleCard({
  id,
  title,
  description,
  category,
  subcategory,
  gameTitle,
  author,
  mediaUrl,
}: ArticleCardProps) {
  const categoryLabel =
    category === 'guide'
      ? `Гайд${subcategory ? ` · ${subcategory}` : ''}`
      : category === 'game_news'
      ? 'Новости игры'
      : 'Новости';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col sm:flex-row">
      {/* Обложка */}
      <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        {mediaUrl ? (
          <img src={mediaUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl font-bold text-gray-300 dark:text-gray-600">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {categoryLabel}
        </span>
      </div>

      {/* Контент */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <Link href={`/knowledge/${id}`} className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition line-clamp-2">
            {title}
          </Link>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{description}</p>
          )}
          {gameTitle && (
            <div className="mt-2 inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
              🎮 {gameTitle}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Link href={`/user/${author.id}`} className="flex items-center gap-2 hover:underline">
            {author.avatarUrl ? (
              <img src={author.avatarUrl} alt={author.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                {author.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{author.name}</span>
          </Link>
          {/* Кнопка подписки убрана из карточки – она есть только на странице статьи */}
        </div>
      </div>
    </div>
  );
}