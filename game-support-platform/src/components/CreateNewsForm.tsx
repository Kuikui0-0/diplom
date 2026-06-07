'use client';
import { useState, useEffect } from 'react';

export default function CreateNewsForm({ gameId }: { gameId: number }) {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, isExclusive, gameId }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      alert('Ошибка при создании новости');
    }
  };

  if (user === null) return <p>Загрузка...</p>;
  if (!user || (user.role !== 'developer' && user.role !== 'admin')) {
    return null; // скрываем для обычных пользователей и гостей
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <div><label>Заголовок: <input type="text" value={title} onChange={e => setTitle(e.target.value)} required /></label></div>
      <div><label>Содержание: <textarea value={content} onChange={e => setContent(e.target.value)} required /></textarea></div>
      <div>
        <div>
  <label>Загрузить файл (изображение/видео): 
    <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
  </label>
</div>
        <label>
          <input type="checkbox" checked={isExclusive} onChange={e => setIsExclusive(e.target.checked)} />
          Только для подписчиков
        </label>
      </div>
      <button type="submit">Опубликовать</button>
    </form>
  );
}