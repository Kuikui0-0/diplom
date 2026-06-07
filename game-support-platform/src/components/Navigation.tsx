'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      });
  }, [user, pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  setUser(null);
  router.push('/login');   // ← вместо '/games'
};

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setNotifications([]);
  };

  const isDeveloperOrAdmin = user && (user.role === 'developer' || user.role === 'admin');
  const unreadCount = notifications.length;

  const handleNotificationClick = async (n: any) => {
    setShowNotif(false);
    // Помечаем как прочитанное
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: n.id }),
    });
    setNotifications(prev => prev.filter(x => x.id !== n.id));

    // Переход в зависимости от типа
    if (n.type === 'comment_reply' && n.relatedId) {
      try {
        const res = await fetch(`/api/comments/${n.relatedId}`);
        if (res.ok) {
          const { articleId } = await res.json();
          router.push(`/knowledge/${articleId}?highlightComment=${n.relatedId}`);
        } else {
          router.push('/knowledge');
        }
      } catch (e) {
        router.push('/knowledge');
      }
    } else if (n.type === 'ticket_status' && n.relatedId) {
      router.push('/profile?tab=tickets');
    } else if (n.type === 'new_ticket') {
      router.push('/profile?tab=tickets');
    } else if (n.type === 'new_article' && n.relatedId) {
      router.push(`/knowledge/${n.relatedId}`);
    } else if (n.type === 'new_game' && n.relatedId) {
      router.push(`/games/${n.relatedId}`);
    }
  };

  return (
    <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Link href="/games">🎮 Игры</Link>
      <Link href="/news">📰 Новости</Link>
      <Link href="/guides">📘 Гайды</Link>
      {isDeveloperOrAdmin && <Link href="/developer/dashboard">🛠️ Панель разработчика</Link>}
      {user && user.role === 'admin' && <Link href="/admin">⚙️ Админ</Link>}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', position: 'relative' }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    background: 'red', color: 'white', borderRadius: '50%',
                    padding: '2px 6px', fontSize: '0.7rem',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0,
                  width: '320px', maxHeight: '400px', overflowY: 'auto',
                  background: 'white', border: '1px solid #ccc', borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)', zIndex: 2000,
                }}>
                  <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
                    <strong>Уведомления</strong>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} style={{ fontSize: '0.8rem' }}>Прочитать все</button>
                    )}
                  </div>
                  {notifications.length === 0 && (
                    <p style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>Нет новых уведомлений</p>
                  )}
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0',
                        fontSize: '0.9rem', cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      {n.message}
                      <br />
                      <small style={{ color: '#aaa' }}>{new Date(n.createdAt).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span>👤</span>
              )}
              {user.name} ({user.role})
            </Link>
            <button onClick={handleLogout} style={{ marginLeft: '0.5rem' }}>Выйти</button>
          </>
        ) : (
          <>
            <Link href="/login">Войти</Link>
            <Link href="/register" style={{ marginLeft: '1rem' }}>Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}