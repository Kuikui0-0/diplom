'use client';
import { useEffect, useState } from 'react';
import prisma from '@/lib/prisma';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setUsers([]);
      })
      .catch(() => {
        setUsers([]);
        setMessage('Не удалось загрузить пользователей');
      });
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage('Роль обновлена');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка');
    }
  };

  const toggleActive = async (userId: number, currentActive: boolean) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive: !currentActive }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentActive } : u));
      setMessage('Статус изменён');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Удалить пользователя навсегда? Это действие необратимо.')) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage('Пользователь удалён');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка удаления');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">⚙️ Панель администратора</h1>
      {message && <p className="text-sm text-green-600 mb-4">{message}</p>}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="py-3 px-4 font-medium">ID</th>
                <th className="py-3 px-4 font-medium">Имя</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Роль</th>
                <th className="py-3 px-4 font-medium">Активен</th>
                <th className="py-3 px-4 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">Нет пользователей</td>
                </tr>
              )}
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="py-3 px-4">{user.id}</td>
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className="border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-gray-200"
                    >
                      <option value="user">Пользователь</option>
                      <option value="developer">Разработчик</option>
                      <option value="admin">Админ</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.isActive ? '✅ Да' : '❌ Нет'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(user.id, user.isActive)}
                        className={`text-xs px-2 py-1 rounded ${
                          user.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}