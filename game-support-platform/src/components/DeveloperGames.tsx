'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DeveloperGames() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/developer/games')
      .then(res => res.json())
      .then(data => setGames(data));
  }, []);

  return (
    <div>
      <h2>Мои игры</h2>
      {games.length === 0 && <p>Вы ещё не создали ни одной игры. Игры, к которым вы имеете отношение (статьи, тикеты), появятся здесь.</p>}
      <ul>
        {games.map((game: any) => (
          <li key={game.id}>
            <strong>{game.title}</strong> — Тикетов: {game._count.tickets}, Отзывов: {game._count.reviews}
            <br />
            <Link href={`/games/${game.id}`}>Просмотр</Link> | <Link href={`/games/${game.id}/news`}>Новости</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}