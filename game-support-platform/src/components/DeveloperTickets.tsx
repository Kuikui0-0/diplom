'use client';
import { useEffect, useState } from 'react';

export default function DeveloperTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/developer/tickets')
      .then(res => res.json())
      .then(data => setTickets(data));
  }, []);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setMessage('');
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setTickets(prev => prev.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t)));
      setMessage('Статус обновлён');
    } else {
      const err = await res.json().catch(() => ({ error: 'Ошибка' }));
      setMessage(`Ошибка: ${err.error}`);
    }
  };

  return (
    <div>
      <h2>Тикеты по моим играм</h2>
      {message && <p>{message}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th>ID</th>
            <th>Игра</th>
            <th>Тема</th>
            <th>Тип</th>
            <th>Статус</th>
            <th>Автор</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{ticket.id}</td>
              <td>{ticket.game?.title || '—'}</td>
              <td>{ticket.title}</td>
              <td>{ticket.type}</td>
              <td>{ticket.status}</td>
              <td>{ticket.author?.name || '—'}</td>
              <td>
                <select
                  value={ticket.status}
                  onChange={e => handleStatusChange(ticket.id, e.target.value)}
                >
                  <option value="open">Открыт</option>
                  <option value="in_progress">В работе</option>
                  <option value="resolved">Решён</option>
                  <option value="closed">Закрыт</option>
                </select>
              </td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr>
              <td colSpan={7}>Тикетов нет</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}