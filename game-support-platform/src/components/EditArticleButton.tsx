'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EditArticleButton({
  articleId,
  authorId,
}: {
  articleId: number;
  authorId: number;
}) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  if (!user || (user.role !== 'admin' && user.userId !== authorId)) return null;

  return (
    <Link
      href={`/knowledge/${articleId}/edit`}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
    >
      ✏️ Редактировать статью
    </Link>
  );
}