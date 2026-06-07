'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExistingChatButton({ targetUserId }: { targetUserId: number }) {
  const [user, setUser] = useState<any>(undefined);
  const [existingChat, setExistingChat] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async res => {
        if (!res.ok) return { user: null };
        const text = await res.text();
        try { return JSON.parse(text); } catch { return { user: null }; }
      })
      .then(data => {
        console.log('[ExistingChatButton] user:', data.user);
        setUser(data.user ?? null);
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user || user.userId === targetUserId) return;
    fetch('/api/messages', { credentials: 'include' })
      .then(res => res.json())
      .then(convs => {
        if (Array.isArray(convs)) {
          const existing = convs.find((c: any) => c.partner?.id === targetUserId);
          if (existing) setExistingChat(existing.id);
        }
      });
  }, [user, targetUserId]);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (existingChat) {
        router.push('/messages');
        return;
      }
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ partnerId: targetUserId }),
      });
      if (res.ok) {
        router.push('/messages');
      } else {
        const text = await res.text();
        let errorMsg = 'Не удалось начать диалог';
        try { const err = JSON.parse(text); if (err.error) errorMsg = err.error; } catch {}
        alert(errorMsg);
      }
    } catch (e) {
      alert('Ошибка сети. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Показываем заглушку, пока не узнали пользователя
  if (user === undefined) {
    return (
      <button disabled className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-300 text-gray-500 cursor-wait">
        Загрузка...
      </button>
    );
  }

  // Скрываем кнопку для гостей и для собственного профиля
  if (!user || user.userId === targetUserId) return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        loading
          ? 'bg-indigo-300 cursor-not-allowed'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {loading ? 'Подождите...' : existingChat ? 'Перейти в чат' : 'Написать сообщение'}
    </button>
  );
}