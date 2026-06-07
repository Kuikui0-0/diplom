'use client';
import { useState, useEffect } from 'react';

interface Genre {
  id: number;
  name: string;
  authorId?: number | null;
}

export default function GenreMultiSelect({
  selectedIds,
  onChange,
  user,
}: {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  user: any;
}) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [newGenreName, setNewGenreName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/genres')
      .then(res => res.json())
      .then(data => setGenres(data))
      .catch(() => setGenres([]));
  }, []);

  const toggleGenre = (genreId: number) => {
    if (selectedIds.includes(genreId)) {
      onChange(selectedIds.filter(id => id !== genreId));
    } else {
      onChange([...selectedIds, genreId]);
    }
  };

  const addNewGenre = async () => {
    if (!newGenreName.trim()) return;
    const res = await fetch('/api/genres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGenreName.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      setGenres(prev => [...prev, created]);
      onChange([...selectedIds, created.id]);
      setNewGenreName('');
      setMessage('');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка');
    }
  };

  const deleteGenre = async (genreId: number) => {
    if (!confirm('Удалить жанр? Это невозможно, если он используется в играх.')) return;
    const res = await fetch(`/api/genres/${genreId}`, { method: 'DELETE' });
    if (res.ok) {
      setGenres(prev => prev.filter(g => g.id !== genreId));
      if (selectedIds.includes(genreId)) {
        onChange(selectedIds.filter(id => id !== genreId));
      }
      setMessage('Жанр удалён');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка удаления');
    }
  };

  const canDelete = (genre: Genre) => {
    if (!user) return false;
    return user.role === 'admin' || user.userId === genre.authorId;
  };

  const canAdd = user && (user.role === 'developer' || user.role === 'admin');

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {genres.map(genre => (
          <div key={genre.id} className="relative inline-flex items-center">
            <button
              type="button"
              onClick={() => toggleGenre(genre.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selectedIds.includes(genre.id)
                  ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-400'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {genre.name}
            </button>
            {canDelete(genre) && (
              <button
                type="button"
                onClick={() => deleteGenre(genre.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center"
                title="Удалить жанр"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {canAdd && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newGenreName}
            onChange={e => setNewGenreName(e.target.value)}
            placeholder="Новый жанр..."
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 flex-1 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
          />
          <button
            type="button"
            onClick={addNewGenre}
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            Добавить
          </button>
        </div>
      )}
      {message && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{message}</p>}
    </div>
  );
}