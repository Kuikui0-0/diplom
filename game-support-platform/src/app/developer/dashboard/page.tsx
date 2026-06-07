'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getTicketTypeLabel } from '@/lib/tickets';

const statusLabels: Record<string, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

function DeveloperGames() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/developer/games')
      .then(res => res.json())
      .then(data => setGames(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Мои игры</h2>
      {games.length === 0 && <p className="text-gray-500 dark:text-gray-400">Вы ещё не создали ни одной игры.</p>}
      <div className="space-y-3">
        {games.map((game: any) => (
          <div key={game.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{game.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Тикетов: {game._count?.tickets ?? 0} | Отзывов: {game._count?.reviews ?? 0}
              </p>
            </div>
            <div className="flex gap-3">
              <a href={`/games/${game.id}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Просмотр</a>
              <a href={`/games/${game.id}/news`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Новости</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeveloperTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [closeReason, setCloseReason] = useState('');

  useEffect(() => {
    fetch('/api/developer/tickets')
      .then(res => res.json())
      .then(data => setTickets(Array.isArray(data) ? data : []));
  }, []);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    if (newStatus === 'resolved' || newStatus === 'closed') {
      setSelectedTicketId(ticketId);
      setNewStatus(newStatus);
      setResolution('');
      setCloseReason('');
      return;
    }
    await submitStatusChange(ticketId, newStatus);
  };

  const submitStatusChange = async (ticketId: number, status: string, extra?: any) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
      setMessage('Статус обновлён');
      setSelectedTicketId(null);
      setNewStatus('');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка');
    }
  };

  const handleSubmitExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !newStatus) return;
    const extra: any = {};
    if (newStatus === 'resolved') {
      extra.resolution = resolution || undefined;
    } else if (newStatus === 'closed') {
      extra.closeReason = closeReason.trim();
      if (!extra.closeReason) {
        setMessage('Причина закрытия обязательна');
        return;
      }
    }
    await submitStatusChange(selectedTicketId, newStatus, extra);
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот тикет? Это действие нельзя отменить.')) return;
    const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
    if (res.ok) {
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      setMessage('Тикет удалён');
    } else {
      const err = await res.json().catch(() => ({ error: 'Ошибка' }));
      setMessage(err.error || 'Ошибка удаления');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Тикеты по моим играм</h2>
      {message && <p className="text-sm text-green-600 mb-2">{message}</p>}
      {tickets.length === 0 ? (
        <p className="text-gray-500">Тикетов нет</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                {['Игра', 'Тема', 'Тип', 'Автор', 'Статус', 'Действия'].map((header) => (
                  <th key={header} className="py-2 pr-4 font-medium">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: any) => (
                <React.Fragment key={ticket.id}>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">{ticket.game?.title || '—'}</td>
                    <td className="py-3 pr-4">{ticket.title}</td>
                    <td className="py-3 pr-4">{getTicketTypeLabel(ticket.type)}</td>
                    <td className="py-3 pr-4">{ticket.author?.name || '—'}</td>
                    <td className="py-3 pr-4">{statusLabels[ticket.status] || ticket.status}</td>
                    <td className="py-3">
                      {selectedTicketId === ticket.id ? (
                        <form onSubmit={handleSubmitExtra} className="flex flex-col gap-2">
                          {newStatus === 'resolved' && (
                            <input
                              type="text"
                              placeholder="Описание решения"
                              value={resolution}
                              onChange={e => setResolution(e.target.value)}
                              className="border rounded px-2 py-1 text-xs w-40"
                            />
                          )}
                          {newStatus === 'closed' && (
                            <input
                              type="text"
                              placeholder="Причина закрытия *"
                              value={closeReason}
                              onChange={e => setCloseReason(e.target.value)}
                              required
                              className="border rounded px-2 py-1 text-xs w-40"
                            />
                          )}
                          <div className="flex gap-2">
                            <button type="submit" className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">OK</button>
                            <button type="button" onClick={() => setSelectedTicketId(null)} className="text-xs text-gray-600">Отмена</button>
                          </div>
                        </form>
                      ) : (
                        <select
                          value={ticket.status}
                          onChange={e => handleStatusChange(ticket.id, e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="open">Открыт</option>
                          <option value="in_progress">В работе</option>
                          <option value="resolved">Решён</option>
                          <option value="closed">Закрыт</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        title="Удалить тикет"
                      >
                        ❌ Удалить
                      </button>
                    </td>
                  </tr>
                  {ticket.resolution && (
                    <tr>
                      <td colSpan={7} className="py-1 pl-4 text-xs text-gray-500">
                        <em>Решение: {ticket.resolution}</em>
                      </td>
                    </tr>
                  )}
                  {ticket.closeReason && (
                    <tr>
                      <td colSpan={7} className="py-1 pl-4 text-xs text-red-500">
                        <em>Причина закрытия: {ticket.closeReason}</em>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeveloperSubscriptions() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [benefits, setBenefits] = useState('');
  const [editingTier, setEditingTier] = useState<any | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/developer/games')
      .then(res => res.json())
      .then(data => setGames(data));
  }, []);

  useEffect(() => {
    if (selectedGameId) {
      fetch(`/api/subscription-tiers?gameId=${selectedGameId}`)
        .then(res => res.json())
        .then(data => setTiers(data));
    }
  }, [selectedGameId]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || !name || !price) {
      setMessage('Заполните название и цену');
      return;
    }

    const url = editingTier
      ? `/api/subscription-tiers/${editingTier.id}`
      : '/api/subscription-tiers';
    const method = editingTier ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price: Number(price), benefits, gameId: selectedGameId }),
    });

    if (res.ok) {
      const updated = await fetch(`/api/subscription-tiers?gameId=${selectedGameId}`);
      setTiers(await updated.json());
      setName('');
      setPrice('');
      setBenefits('');
      setEditingTier(null);
      setMessage('Сохранено');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка');
    }
  };

  const handleEdit = (tier: any) => {
    setEditingTier(tier);
    setName(tier.name);
    setPrice(String(tier.price));
    setBenefits(tier.benefits || '');
  };

  const handleDelete = async (tierId: number) => {
    if (!confirm('Удалить уровень подписки?')) return;
    const res = await fetch(`/api/subscription-tiers/${tierId}`, { method: 'DELETE' });
    if (res.ok) {
      setTiers(prev => prev.filter(t => t.id !== tierId));
    } else {
      const err = await res.json();
      alert('Ошибка удаления: ' + (err.error || 'Неизвестно'));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Управление подписками</h2>
      <select
        value={selectedGameId ?? ''}
        onChange={e => setSelectedGameId(e.target.value ? Number(e.target.value) : null)}
        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm mb-4"
      >
        <option value="">Выберите игру</option>
        {games.map((g: any) => (
          <option key={g.id} value={g.id}>{g.title}</option>
        ))}
      </select>

      {selectedGameId && (
        <>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
            {editingTier ? 'Редактировать уровень' : 'Создать уровень'}
          </h3>
          <form onSubmit={handleCreateOrUpdate} className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Название"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 w-full text-sm"
            />
            <input
              type="number"
              placeholder="Цена (₽/мес)"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 w-full text-sm"
            />
            <textarea
              placeholder="Преимущества"
              value={benefits}
              onChange={e => setBenefits(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 w-full text-sm"
              rows={2}
            />
            <button type="submit" className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600">
              {editingTier ? 'Сохранить изменения' : 'Создать'}
            </button>
            {editingTier && (
              <button type="button" onClick={() => setEditingTier(null)} className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Отмена
              </button>
            )}
          </form>

          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Существующие уровни</h3>
          {tiers.length === 0 && <p className="text-gray-500 dark:text-gray-400">Нет уровней подписки</p>}
          <div className="space-y-2">
            {tiers.map(tier => (
              <div key={tier.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between text-sm">
                <div>
                  <strong className="text-gray-900 dark:text-white">{tier.name}</strong> — {tier.price} ₽/мес
                  <br />
                  <span className="text-gray-500 dark:text-gray-400">{tier.benefits}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(tier)} className="text-indigo-600 dark:text-indigo-400 hover:underline">Редактировать</button>
                  <button onClick={() => handleDelete(tier.id)} className="text-red-600 dark:text-red-400 hover:underline">Удалить</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {message && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>}
    </div>
  );
}

// 🔹 Компонент, который использует useSearchParams (вынесен для Suspense)
function DashboardContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'games' | 'tickets' | 'subscriptions'>(
    tabFromUrl === 'tickets' ? 'tickets' : tabFromUrl === 'subscriptions' ? 'subscriptions' : 'games'
  );

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || (data.user.role !== 'developer' && data.user.role !== 'admin')) {
          window.location.href = '/login';
        }
      });
  }, []);

  return (
    <div>
      <div className="flex gap-4 mb-6">
        {(['games', 'tickets', 'subscriptions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab === 'games' && 'Мои игры'}
            {tab === 'tickets' && 'Тикеты'}
            {tab === 'subscriptions' && 'Подписки'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {activeTab === 'games' && <DeveloperGames />}
        {activeTab === 'tickets' && <DeveloperTickets />}
        {activeTab === 'subscriptions' && <DeveloperSubscriptions />}
      </div>
    </div>
  );
}

// 🔹 Основной компонент страницы – оборачиваем DashboardContent в Suspense
export default function DeveloperDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">🛠️ Панель разработчика</h1>
      <Suspense fallback={<div className="text-center py-10">Загрузка...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}