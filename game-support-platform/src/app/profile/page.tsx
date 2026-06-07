'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import CoverUploader from '@/components/CoverUploader';
import { getTicketStatusLabel } from '@/lib/tickets';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [showFollowersList, setShowFollowersList] = useState(true);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMessage, setPassMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        if (data.user) {
          setName(data.user.name);
          setAvatarUrl(data.user.avatarUrl || '');
          loadTickets(data.user.userId, 'all');
          loadSubscriptions();
          loadFollowers();
          loadFollowing();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadTickets = (userId: number, status: string) => {
    fetch(`/api/my-tickets?status=${status}`)
      .then(res => res.json())
      .then(data => setTickets(data));
  };

  const loadSubscriptions = () => {
    fetch('/api/subscribe')
      .then(res => res.json())
      .then(data => setSubscriptions(data));
  };

  const loadFollowers = () => {
    fetch('/api/user/followers')
      .then(res => res.json())
      .then(data => setFollowers(Array.isArray(data) ? data : []));
  };

  const loadFollowing = () => {
    fetch('/api/user/following')
      .then(res => res.json())
      .then(data => setFollowing(Array.isArray(data) ? data : []));
  };

  const handleCancelSubscription = async (subId: number) => {
    await fetch('/api/subscribe', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: subId }),
    });
    loadSubscriptions();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setUploading(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl: avatarUrl || null }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setAvatarUrl(data.user.avatarUrl || '');
        setProfileMessage('Профиль обновлён');
      } else {
        const err = await res.json();
        setProfileMessage(err.error || 'Ошибка обновления');
      }
    } catch (error) {
      setProfileMessage('Ошибка сети или сервера. Попробуйте позже.');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage('');
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
    });
    const data = await res.json();
    if (res.ok) {
      setPassMessage('Пароль успешно изменён');
      setOldPass('');
      setNewPass('');
    } else {
      setPassMessage(data.error || 'Ошибка');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Загрузка...</div>;
  if (!user) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Пожалуйста, <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">войдите</Link>.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Личный кабинет</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Аватар" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-xl font-bold text-gray-400 dark:text-gray-500">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Роль: {user.role === 'user' ? 'Пользователь' : user.role === 'developer' ? 'Разработчик' : 'Администратор'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Редактировать профиль</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Имя</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Аватар</label>
            <CoverUploader currentUrl={avatarUrl} onChange={(url) => setAvatarUrl(url || '')} />
          </div>
          <button type="submit" disabled={uploading}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50">
            {uploading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          {profileMessage && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{profileMessage}</p>}
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Подписчики ({followers.length})</h2>
          <button onClick={() => setShowFollowersList(!showFollowersList)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            {showFollowersList ? 'Свернуть' : 'Развернуть'}
          </button>
        </div>
        {showFollowersList && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              {followers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Нет подписчиков</p>
              ) : (
                <ul className="space-y-2">
                  {followers.map(follower => (
                    <li key={follower.id} className="flex items-center gap-3">
                      {follower.avatarUrl ? (
                        <img src={follower.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                          {follower.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <Link href={`/user/${follower.id}`} className="text-sm text-gray-800 dark:text-gray-200 hover:underline">
                        {follower.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Подписки ({following.length})</h3>
              {following.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Нет подписок</p>
              ) : (
                <ul className="space-y-2">
                  {following.map(following => (
                    <li key={following.id} className="flex items-center gap-3">
                      {following.avatarUrl ? (
                        <img src={following.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                          {following.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <Link href={`/user/${following.id}`} className="text-sm text-gray-800 dark:text-gray-200 hover:underline">
                        {following.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Мои тикеты</h2>
        <select value={ticketFilter} onChange={e => { setTicketFilter(e.target.value); loadTickets(user.userId, e.target.value); }}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm mb-4">
          <option value="all">Все</option>
          <option value="open">Открытые</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Решённые</option>
          <option value="closed">Закрытые</option>
        </select>
        {tickets.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Тикетов нет</p>}
        <ul className="space-y-2">
          {tickets.map(ticket => (
            <li key={ticket.id} className="text-sm text-gray-800 dark:text-gray-200">
  <strong>#{ticket.id} {ticket.title}</strong> — {getTicketStatusLabel(ticket.status)} (Игра: {ticket.game.title})
</li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Мои подписки</h2>
        {subscriptions.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Нет активных подписок</p>}
        <ul className="space-y-3">
          {subscriptions.map(sub => (
            <li key={sub.id} className="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200">
              <span>
                Игра: {sub.tier.game.title}, уровень: {sub.tier.name}, цена: {sub.tier.price} ₽
              </span>
              {sub.status === 'active' && (
                <button onClick={() => handleCancelSubscription(sub.id)}
                  className="text-red-600 dark:text-red-400 hover:underline ml-4">
                  Отменить
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Сменить пароль</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Старый пароль</label>
            <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} required
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Новый пароль</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <button type="submit"
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600">
            Сменить
          </button>
          {passMessage && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{passMessage}</p>}
        </form>
      </div>
    </div>
  );
}