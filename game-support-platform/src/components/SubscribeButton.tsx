'use client';
import { useState, useEffect } from 'react';

export default function SubscribeButton({
  gameId,
  authorId,
}: {
  gameId: number;
  authorId?: number | null;
}) {
  const [user, setUser] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [showTiers, setShowTiers] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));

    fetch(`/api/subscription-tiers?gameId=${gameId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTiers(data);
        } else {
          setTiers([]);
        }
      })
      .catch(() => setTiers([]));
  }, [gameId]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/subscribe')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const activeSub = data.find(
            (s: any) => s.tier?.gameId === gameId && s.status === 'active'
          );
          setSubscription(activeSub || null);
        }
      });
  }, [gameId, user]);

  const handleSubscribe = async (tierId: number) => {
    if (!user) {
      alert('Необходимо войти');
      return;
    }
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId }),
    });
    if (res.ok) {
      const newSub = await res.json();
      setSubscription(newSub);
      setShowTiers(false);
      setMessage('Подписка оформлена!');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка');
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    const res = await fetch('/api/subscribe', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: subscription.id }),
    });
    if (res.ok) {
      setSubscription(null);
      setMessage('Подписка отменена');
    } else {
      const err = await res.json();
      setMessage(err.error || 'Ошибка');
    }
  };

  if (!user) return null;

  return (
    <div className="mt-2">
      {subscription ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 dark:text-green-400">
            ✅ Подписка активна ({subscription.tier.name})
          </span>
          <button
            onClick={handleCancel}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Отменить подписку
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowTiers(!showTiers)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Подписаться
        </button>
      )}

      {showTiers && tiers.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {tiers.map((tier: any) => (
            <div key={tier.id} className="border dark:border-gray-700 rounded-xl p-4 w-48 bg-white dark:bg-gray-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{tier.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{tier.price} ₽/мес</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{tier.benefits}</p>
              <button
                onClick={() => handleSubscribe(tier.id)}
                className="mt-2 bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Выбрать
              </button>
            </div>
          ))}
        </div>
      )}
      {message && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>}
    </div>
  );
}