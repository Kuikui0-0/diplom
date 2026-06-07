'use client';
import { useState, useEffect } from 'react';

export default function CreateTicketForm({ gameId }: { gameId: number }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('bug');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUserId(data.user.userId);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('Необходимо войти');
      return;
    }
    if (!title.trim() || !description.trim()) {
      alert('Заполните тему и описание');
      return;
    }

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        type,
        gameId,
      }),
    });

    if (res.ok) {
      window.location.reload();
    } else {
      const err = await res.json();
      alert(`Ошибка: ${err.error}`);
    }
  };

  if (!userId) {
    return <p>Для создания тикета необходимо <a href="/login">войти</a>.</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Тема: <input type="text" value={title} onChange={e => setTitle(e.target.value)} required /></label>
      </div>
      <div>
        <label>Описание: <textarea value={description} onChange={e => setDescription(e.target.value)} required /></label>
      </div>
      <div>
        <label>Тип:
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="bug">Баг</option>
            <option value="feature">Фича</option>
            <option value="question">Вопрос</option>
          </select>
        </label>
      </div>
      <button type="submit">Отправить</button>
    </form>
  );
}