'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import prisma from '@/lib/prisma';

export default function SubscribePage() {
  const { id: gameId } = useParams();
  const [tiers, setTiers] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/subscription-tiers?gameId=${gameId}`)
      .then(res => res.json())
      .then(data => setTiers(data));
  }, [gameId]);

  const handleSubscribe = async (tierId: number) => {
    setMessage('');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId }),
    });
    if (res.ok) {
      setMessage('✅ Подписка оформлена!');
    } else {
      const error = await res.json();
      setMessage(`❌ ${error.error}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Оформление подписки</h1>
      {message && <p>{message}</p>}
      {tiers.length === 0 && <p>Для этой игры пока нет уровней подписки.</p>}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {tiers.map(tier => (
          <div key={tier.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', flex: 1 }}>
            <h2>{tier.name}</h2>
            <p>Цена: {tier.price} ₽/мес</p>
            <p>{tier.benefits}</p>
            <button onClick={() => handleSubscribe(tier.id)}>Подписаться</button>
          </div>
        ))}
      </div>
    </div>
  );
}