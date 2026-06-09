'use client';
import { useState, useEffect } from 'react';
import DeveloperGames from '@/components/DeveloperGames';
import DeveloperTickets from '@/components/DeveloperTickets';
import DeveloperSubscriptions from '@/components/DeveloperSubscriptions';
import prisma from '@/lib/prisma';

export default function DeveloperDashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'games' | 'tickets' | 'subscriptions'>('games');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || (data.user.role !== 'developer' && data.user.role !== 'admin')) {
          window.location.href = '/login';
        } else {
          setUser(data.user);
        }
      });
  }, []);

  if (!user) return <div>Проверка доступа...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🛠️ Панель разработчика</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('games')}
          style={{ fontWeight: activeTab === 'games' ? 'bold' : 'normal' }}
        >
          Мои игры
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          style={{ fontWeight: activeTab === 'tickets' ? 'bold' : 'normal' }}
        >
          Тикеты
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          style={{ fontWeight: activeTab === 'subscriptions' ? 'bold' : 'normal' }}
        >
          Подписки
        </button>
      </div>

      {activeTab === 'games' && <DeveloperGames />}
      {activeTab === 'tickets' && <DeveloperTickets />}
      {activeTab === 'subscriptions' && <DeveloperSubscriptions />}
    </div>
  );
}