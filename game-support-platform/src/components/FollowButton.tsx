'use client';
import { useState, useEffect } from 'react';

export default function FollowButton({ targetUserId }: { targetUserId: number }) {
  const [user, setUser] = useState<any>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user?.userId) return;
    fetch(`/api/user/follow?targetUserId=${targetUserId}`)
      .then(res => res.json())
      .then(data => setFollowing(data.following))
      .catch(() => setFollowing(false));
  }, [user, targetUserId]);

  const handleToggle = async () => {
    if (!user) {
      setError('Необходимо войти');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
      } else {
        setError(data.error || 'Ошибка');
      }
    } catch (e) {
      setError('Ошибка сети');
    }
    setLoading(false);
  };

  if (user?.userId === targetUserId) return null;

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`px-3 py-1 rounded-lg text-xs font-medium ${
          following
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {loading ? '...' : following ? 'Вы подписаны' : 'Подписаться'}
      </button>
      {error && <p style={{ color: 'red', fontSize: '0.7rem' }}>{error}</p>}
    </div>
  );
}