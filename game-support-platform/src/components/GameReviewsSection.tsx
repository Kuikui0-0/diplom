'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Review {
  id: number;
  rating: number;
  content: string | null;
  createdAt: string;
  author: { id: number; name: string; avatarUrl?: string | null };
}

export default function GameReviewsSection({ gameId }: { gameId: number }) {
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState('0');
  const [count, setCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myContent, setMyContent] = useState('');
  const [message, setMessage] = useState('');

  const loadReviews = () => {
    fetch(`/api/games/${gameId}/reviews`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.reviews || []);
        setAverage(data.average || '0');
        setCount(data.count || 0);
      });
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        if (data.user) {
          const my = reviews.find(r => r.author.id === data.user.userId);
          if (my) {
            setMyRating(my.rating);
            setMyContent(my.content || '');
          }
        }
      });
    loadReviews();
  }, [gameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Необходимо войти');
      return;
    }
    if (myRating < 1 || myRating > 5) {
      setMessage('Поставьте оценку от 1 до 5');
      return;
    }

    const res = await fetch(`/api/games/${gameId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: myRating, content: myContent || undefined }),
    });
    if (res.ok) {
      setMessage('Ваш отзыв сохранён!');
      loadReviews();
    } else {
      const err = await res.json();
      setMessage(`Ошибка: ${err.error}`);
    }
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Рейтинг и отзывы</h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{average}</span>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${star <= Math.round(Number(average)) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">({count} отзывов)</span>
        </div>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Ваша оценка:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setMyRating(star)}
                  className={`text-2xl transition-colors ${
                    star <= myRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                  } hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={myContent}
            onChange={e => setMyContent(e.target.value)}
            placeholder="Ваш отзыв (необязательно)..."
            rows={3}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          />
          <div className="flex items-center justify-between mt-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Сохранить отзыв
            </button>
            {message && (
              <span className={`text-sm ${message.includes('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </span>
            )}
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-6">Пока нет отзывов. Будьте первым!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700"
            >
              {review.author.avatarUrl ? (
                <img src={review.author.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                  {review.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/user/${review.author.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:underline">
                    {review.author.name}
                  </Link>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                {review.content && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{review.content}</p>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 block">
                  {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}