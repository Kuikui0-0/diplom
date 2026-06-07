import Link from 'next/link';

export default function GameCard({
  id,
  title,
  genre,
  iconUrl,
  averageRating,
  reviewCount,
  minSubscriptionPrice,
  platforms,
}: {
  id: number;
  title: string;
  genre?: string | null;
  iconUrl?: string | null;
  averageRating: number;
  reviewCount: number;
  minSubscriptionPrice?: number | null;
  platforms?: { name: string }[];
}) {
  return (
    <Link
      href={`/games/${id}`}
      className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      <div className="relative w-full h-44 bg-gray-100 dark:bg-gray-700">
        {iconUrl ? (
          <img src={iconUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center h-full text-3xl font-bold text-gray-300 dark:text-gray-600">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        {genre && (
          <span className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {genre}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
        
        {platforms && platforms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {platforms.map((p: any, idx: number) => (
              <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {p.name === 'Android' ? '📱' : '💻'} {p.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-yellow-500">
            <span className="text-sm">⭐</span>
            <span className="text-xs font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">({reviewCount})</span>
          </div>
          {minSubscriptionPrice != null && (
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
              от {minSubscriptionPrice} ₽
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}