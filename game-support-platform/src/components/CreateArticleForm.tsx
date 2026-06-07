'use client';
import { useState, useEffect } from 'react';
import CoverUploader from './CoverUploader';

interface Game {
  id: number;
  title: string;
}

export default function CreateArticleForm({
  defaultCategory = 'news',
}: {
  defaultCategory?: 'news' | 'game_news' | 'guide';
}) {
  const isGuidePage = defaultCategory === 'guide';

  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [subcategory, setSubcategory] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
    fetch('/api/games')
      .then(res => res.json())
      .then(data => setGames(Array.isArray(data) ? data : []));
  }, []);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage('Необходимо войти');
      return;
    }

    if (category === 'game_news' && !gameId) {
      setMessage('Выберите игру для новости об игре');
      return;
    }

    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || undefined,
        content,
        category,
        subcategory: category === 'guide' ? subcategory || undefined : undefined,
        gameId: category === 'game_news' ? gameId : null,
        authorId: user.userId,
        mediaUrl: mediaUrl || undefined,
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Ошибка сервера';
      try {
        const err = await res.json();
        if (err.error) errorMsg = err.error;
      } catch (e) {}
      setMessage(`Ошибка: ${errorMsg}`);
      return;
    }

    const article = await res.json();
    const articleId = article.id;

    if (files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`/api/articles/${articleId}/media`, { method: 'POST', body: formData });
      }
    }

    window.location.reload();
  };

  if (user === null) return <p className="text-gray-500">Загрузка...</p>;
  if (!user) return <p className="text-gray-500">Для создания статьи <a href="/login" className="text-indigo-600 hover:underline">войдите</a>.</p>;

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 transition-colors";
  const fileInputClass = "mt-1 block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-200 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 transition-colors cursor-pointer";

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Добавить статью</h2>
      {message && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Краткое описание</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Содержание</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} required rows={5} className={inputClass} />
        </div>

        {!isGuidePage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value as any);
                setSubcategory('');
              }}
              className={inputClass}
            >
              <option value="news">Общие новости</option>
              <option value="game_news">Новость об игре</option>
              <option value="guide">Гайд</option>
            </select>
          </div>
        )}

        {category === 'guide' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип гайда (необязательно)</label>
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className={inputClass}>
              <option value="">Без подкатегории</option>
              <option value="engine">Движки</option>
              <option value="mechanics">Механики</option>
              <option value="assets">Ассеты / Арты</option>
            </select>
          </div>
        )}

        {category === 'game_news' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Игра</label>
            <select value={gameId ?? ''} onChange={e => setGameId(e.target.value ? Number(e.target.value) : null)} required className={inputClass}>
              <option value="">Выберите игру</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Обложка</label>
          <CoverUploader currentUrl={mediaUrl} onChange={(url) => setMediaUrl(url || '')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Изображения и видео</label>
          <input type="file" accept="image/*,video/*" multiple onChange={handleFilesChange} className={fileInputClass} />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((file, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                  {file.name}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Опубликовать
        </button>
      </form>
    </div>
  );
}