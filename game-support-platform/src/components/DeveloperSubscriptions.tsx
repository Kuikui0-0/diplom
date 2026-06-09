'use client';
import { useEffect, useState } from 'react';
    
export default function DeveloperSubscriptions() {
  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/developer/subscriptions')
      .then(res => res.json())
      .then(data => setTiers(data));
  }, []);

  return (
    <div>
      <h2>Уровни подписки</h2>
      {tiers.length === 0 && <p>Нет созданных уровней подписки.</p>}
      <ul>
        {tiers.map((tier: any) => (
          <li key={tier.id}>{tier.name} - {tier.price} ₽</li>
        ))}
      </ul>
    </div>
  );
}