'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CoverUploader from '@/components/CoverUploader';
import MediaUploader from '@/components/MediaUploader';
import prisma from '@/lib/prisma';

interface Media {
  id: number;
  url: string;
  type: string;
}

export default function EditArticlePage() {
  const { id } = useParams();
  const articleId = Number(id);
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('news');
  const [subcategory, setSubcategory] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [authorId, setAuthorId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));

    fetch(`/api/articles/${articleId}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setContent(data.content || '');
        setCategory(data.category || 'news');
        setSubcategory(data.subcategory || '');
        setMediaUrl(data.mediaUrl || '');
        setMedia(data.media || []);
        setAuthorId(data.authorId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [articleId]);

  const canEdit = user && (user.role === 'admin' || user.userId === authorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canEdit) {
      setMessage('Недостаточно прав для редактирования');
      return;
    }
    const res = await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        content,
        category,
        subcategory: category === 'guide' ? subcategory : null,
        mediaUrl,
      }),
    });
    if (res.ok) {
      router.push(`/knowledge/${articleId}`);
    } else {
      const err = await res.json();
      setMessage(`Ошибка: ${err.error || 'Ошибка сервера'}`);
    }
  };

  const uploadNewMedia = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      await fetch(`/api/articles/${articleId}/media`, { method: 'POST', body: formData });
    }
    const res = await fetch(`/api/articles/${articleId}`);
    const data = await res.json();
    setMedia(data.media || []);
  };

  const deleteMedia = async (mediaId: number) => {
    await fetch(`/api/articles/${articleId}/media/${mediaId}`, { method: 'DELETE' });
    setMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  if (!user) return <p className="p-8 text-center text-gray-500">Пожалуйста, <a href="/login" className="text-indigo-600 hover:underline">войдите</a>.</p>;
  if (!canEdit) return <div className="p-8 text-center text-gray-500">Доступ запрещён.</div>;

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 transition-colors";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Редактирование статьи</h1>
      {message && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Краткое описание</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Содержание</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} required rows={6} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
          <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }} className={inputClass}>
            <option value="news">Новости</option>
            <option value="game_news">Новости мира игр</option>
            <option value="guide">Гайды</option>
          </select>
        </div>
        {category === 'guide' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип гайда</label>
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className={inputClass}>
              <option value="">Выберите подкатегорию</option>
              <option value="engine">Движки</option>
              <option value="mechanics">Механики</option>
              <option value="assets">Ассеты / Арты</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Обложка</label>
          <CoverUploader currentUrl={mediaUrl} onChange={(url) => setMediaUrl(url || '')} />
        </div>
        <fieldset className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Скриншоты и видео</legend>
          <MediaUploader
            existingMedia={media}
            onUpload={uploadNewMedia}
            onDelete={deleteMedia}
          />
        </fieldset>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Сохранить изменения
        </button>
      </form>
    </div>
  );
}