'use client';
import { useState, useEffect, useRef } from 'react';

export default function CreateNewsForm({ gameId }: { gameId: number }) {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage('Необходимо войти');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Отправляем данные на единый API для статей
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category: 'game_news',
          gameId,
          authorId: user.userId,
          // isExclusive — если в схеме Article нет этого поля, его нельзя передавать!
          // Если есть — раскомментируйте:
          // isExclusive,
        }),
      });

      // Читаем тело ответа (текст или JSON)
      const text = await res.text();

      if (!res.ok) {
        // Пытаемся распарсить ошибку, если это JSON
        let errorMsg = 'Неизвестная ошибка';
        try {
          const err = JSON.parse(text);
          errorMsg = err.error || err.message || errorMsg;
        } catch {
          // Если не JSON, используем сырой текст (обрезаем до 100 символов)
          errorMsg = text || res.statusText || `Ошибка ${res.status}`;
        }
        throw new Error(errorMsg);
      }

      // Успешно — перезагружаем страницу, чтобы обновить список новостей
      window.location.reload();
    } catch (err: any) {
      setMessage(err.message || 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (user === null) return <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>;
  if (!user || (user.role !== 'developer' && user.role !== 'admin')) {
    return null;
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors";

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Добавить новость</h3>
      {message && (
        <p className={`text-sm mb-2 ${message.includes('Ошибка') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className={inputClass}
            placeholder="Заголовок новости"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Содержание</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={4}
            className={inputClass}
            placeholder="Текст новости..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Загрузить файл (изображение/видео)</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                         bg-indigo-50 dark:bg-indigo-900/30
                         border-indigo-200 dark:border-indigo-700
                         text-indigo-700 dark:text-indigo-300
                         hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Выбрать файл
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
              {file ? file.name : 'Файл не выбран'}
            </span>
            {file && (
              <button
                type="button"
                onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={isExclusive}
            onChange={e => setIsExclusive(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
          />
          Только для подписчиков
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Публикация...' : 'Опубликовать'}
        </button>
      </form>
    </div>
  );
}