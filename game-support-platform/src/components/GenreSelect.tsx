'use client';
import { useState, useEffect } from 'react';

interface Genre {
  id: number;
  name: string;
}

export default function GenreSelect({
  value,
  onChange,
  user,
}: {
  value: number | null;
  onChange: (genreId: number | null) => void;
  user: any;
}) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [newGenre, setNewGenre] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/genres')
      .then(res => res.json())
      .then(data => setGenres(data))
      .catch(() => setGenres([]));
  }, []);

  const handleAddGenre = async () => {
    if (!newGenre.trim()) return;
    const res = await fetch('/api/genres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGenre.trim() }),
    });
    if (res.ok) {
      const created = await res.json();
      setGenres(prev => [...prev, created]);
      onChange(created.id);
      setNewGenre('');
      setMessage('');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка');
    }
  };

  const canAdd = user && (user.role === 'developer' || user.role === 'admin');

  return (
    <div>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        className="border rounded px-3 py-2 w-full"
      >
        <option value="">Без жанра</option>
        {genres.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      {canAdd && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newGenre}
            onChange={e => setNewGenre(e.target.value)}
            placeholder="Новый жанр..."
            className="border rounded px-3 py-2 flex-1"
          />
          <button type="button" onClick={handleAddGenre} className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700">
            Добавить
          </button>
        </div>
      )}
      {message && <p className="text-red-500 text-sm">{message}</p>}
    </div>
  );
}