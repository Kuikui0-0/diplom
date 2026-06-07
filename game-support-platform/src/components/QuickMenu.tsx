'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function QuickMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Определяем текущую тему при монтировании
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setNotifications([]);
  };

  const unreadCount = notifications.length;

  const handleNotificationClick = async (n: any) => {
    setOpen(false);
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: n.id }),
    });
    setNotifications(prev => prev.filter(x => x.id !== n.id));

    if (n.type === 'comment_reply' && n.relatedId) {
      try {
        const res = await fetch(`/api/comments/${n.relatedId}`);
        if (res.ok) {
          const { articleId } = await res.json();
          router.push(`/knowledge/${articleId}?highlightComment=${n.relatedId}`);
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
    } else if (n.type === 'new_message' && n.relatedId) {
      router.push('/messages');
    }
  };

  // Скрываем меню на страницах входа и регистрации
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Ссылки меню
  const links = [
    { href: '/games', label: '🎮 Игры', show: true },
    { href: '/news', label: '📰 Новости', show: true },
    { href: '/guides', label: '📘 Гайды', show: true },
    { href: '/developer/dashboard', label: '🛠️ Панель разработчика', show: user?.role === 'developer' || user?.role === 'admin' },
    { href: '/messages', label: '💬 Сообщения', show: !!user },
    { href: '/profile', label: '👤 Профиль', show: !!user },
    { href: '/admin', label: '⚙️ Админ', show: user?.role === 'admin' },
    { label: 'divider', show: !!user },
    { href: '/login', label: 'Войти', show: !user },
    { href: '/register', label: 'Регистрация', show: !user },
  ].filter(item => item.show);

  return (
    <div ref={menuRef} className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center text-lg transition-transform transform active:scale-95 relative"
      >
        {open ? '✕' : '☰'}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-1">
          {user && (
            <>
              <div className="px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 flex justify-between items-center">
                <span>Уведомления ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    Прочитать все
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-1">Нет новых уведомлений</p>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-gray-700 dark:text-gray-300"
                    >
                      {n.message}
                      <br />
                      <span className="text-gray-400 dark:text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {links.map((item, idx) => {
            if (item.label === 'divider') {
              return <hr key={idx} className="my-1 border-gray-200 dark:border-gray-700" />;
            }
            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-400 transition"
              >
                {item.label}
              </Link>
            );
          })}

          {/* Кнопка переключения темы */}
          <button
            onClick={toggleDarkMode}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition"
          >
            {darkMode ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
            >
              🚪 Выйти
            </button>
          )}
        </div>
      )}
    </div>
  );
}