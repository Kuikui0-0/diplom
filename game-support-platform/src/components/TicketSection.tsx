'use client';
import { useState } from 'react';
import CreateTicketForm from './CreateTicketForm';
import { getTicketStatusLabel, getTicketTypeLabel, getTicketPriorityLabel } from '@/lib/tickets';

const statusLabels: Record<string, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

interface Ticket {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  author: { name: string };
  createdAt: string;
}

export default function TicketSection({
  tickets,
  gameId,
}: {
  tickets: Ticket[];
  gameId: number;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Тикеты ({tickets.length})</h2>
      {!showForm && (
        <button onClick={() => setShowForm(true)}>Создать тикет</button>
      )}
      {showForm && (
        <div style={{ margin: '1rem 0' }}>
          <CreateTicketForm gameId={gameId} />
          <button onClick={() => setShowForm(false)} style={{ marginTop: '0.5rem' }}>
            Отмена
          </button>
        </div>
      )}
      {tickets.length === 0 && <p>Тикетов пока нет.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tickets.map((ticket) => (
          <li
            key={ticket.id}
            style={{
              border: '1px solid #ccc',
              marginBottom: '1rem',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <strong>{ticket.title}</strong>{' '}
            <span style={{ color: '#888' }}>#{ticket.id}</span>
            <p>{ticket.description}</p>
            <span>
  Тип: {getTicketTypeLabel(ticket.type)} | Приоритет: {getTicketPriorityLabel(ticket.priority)} | Статус: {getTicketStatusLabel(ticket.status)}
</span>
            <br />
            <small>Автор: {ticket.author?.name || 'Неизвестный'}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}