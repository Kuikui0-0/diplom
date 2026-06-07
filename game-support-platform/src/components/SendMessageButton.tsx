'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SendMessageButton({ targetUserId }: { targetUserId: number }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  if (!user || user.userId === targetUserId) return null; // не показываем для себя

  const handleClick = async () => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId: targetUserId, text: 'Привет!' }),
    });

    if (res.ok) {
      router.push('/messages');
    } else {
      alert('Не удалось начать диалог');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
    >
      Написать сообщение
    </button>
  );
}