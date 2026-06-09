'use client';

import { useState, useEffect } from 'react';

interface GameUpdate {
  id: number;
  version: string | null;
  title: string;
  content: string;
  createdAt: string;
}

export default function GameUpdates({
  gameId,
  isOwnerOrAdmin,
}: {
  gameId: number;
  isOwnerOrAdmin: boolean;
}) {
  const [updates, setUpdates] = useState<GameUpdate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/games/${gameId}/updates`)
      .then(r => r.json())
      .then(setUpdates);
  }, [gameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/games/${gameId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version, title, content }),
    });
    if (res.ok) {
      const newUpdate = await res.json();
      setUpdates(prev => [newUpdate, ...prev]);
      setVersion('');
      setTitle('');
      setContent('');
      setShowForm(false);
    }
    setLoading(false);
  };

  const handleDelete = async (updateId: number) => {
    if (!confirm('Удалить обновление?')) return;
    const res = await fetch(`/api/games/${gameId}/updates/${updateId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setUpdates(prev => prev.filter(u => u.id !== updateId));
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Обновления и изменения
        </h2>
        {isOwnerOrAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showForm ? 'Отмена' : 'Добавить обновление'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 space-y-3 border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Версия (необязательно), например v1.2.0"
            value={version}
            onChange={e => setVersion(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Заголовок обновления"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Перечень изменений:
- Исправлено: ...
- Добавлено: ..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={5}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Опубликовать'}
          </button>
        </form>
      )}

      {updates.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Пока нет обновлений.</p>
      ) : (
        <div className="space-y-4">
          {updates.map(update => (
            <div
              key={update.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {update.version && (
                      <span className="text-xs px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                        {update.version}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(update.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{update.title}</h3>
                </div>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Удалить
                  </button>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {update.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}