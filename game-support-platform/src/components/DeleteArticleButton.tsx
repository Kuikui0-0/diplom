'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteArticleButton({
  articleId,
  authorId,
}: {
  articleId: number;
  authorId: number;
}) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  const handleDelete = async () => {
    if (!confirm('Удалить статью навсегда? Это действие необратимо.')) return;
    const res = await fetch(`/api/articles/${articleId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/knowledge');
    } else {
      alert('Ошибка удаления');
    }
  };

  if (!user || (user.role !== 'admin' && user.userId !== authorId)) return null;

  return (
    <button
      onClick={handleDelete}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
    >
      🗑️ Удалить статью
    </button>
  );
}