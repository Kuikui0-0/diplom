'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import GenreMultiSelect from '@/components/GenreMultiSelect';
import CoverUploader from '@/components/CoverUploader';
import PlatformSelect from '@/components/PlatformSelect';
import MediaUploader from '@/components/MediaUploader';
import TierSelect from '@/components/TierSelect';
import prisma from '@/lib/prisma';

interface Media {
  id: number;
  url: string;
  type: string;
}
interface GameFile {
  id: number;
  url: string;
  platformId: number;
}

export default function EditGamePage() {
  const { id } = useParams();
  const gameId = Number(id);
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [platformIds, setPlatformIds] = useState<number[]>([]);
  const [gameFiles, setGameFiles] = useState<GameFile[]>([]);
  const [platformFiles, setPlatformFiles] = useState<Record<number, File | null>>({});
  const [requiredTier, setRequiredTier] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));

    fetch(`/api/games/${gameId}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setGenreIds(data.gameGenres?.map((gg: any) => gg.genreId) || []);
        setMediaUrl(data.mediaUrl || '');
        setMedia(data.media || []);
        setPlatformIds(data.gamePlatforms?.map((gp: any) => gp.platformId) || []);
        setGameFiles(data.gameFiles || []);
        setRequiredTier(data.requiredTier || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gameId]);

  const handlePlatformFileChange = (platformId: number, file: File | null) => {
    setPlatformFiles(prev => ({ ...prev, [platformId]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Загрузка новых файлов платформ
    for (const platformId of platformIds) {
      const file = platformFiles[platformId];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('platformId', String(platformId));
        await fetch(`/api/games/${gameId}/files`, { method: 'POST', body: formData });
      }
    }

    const res = await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        genreIds,
        platformIds,
        mediaUrl,
        requiredTier,
      }),
    });

    if (res.ok) {
      router.push(`/games/${gameId}`);
    } else {
      const err = await res.json();
      setMessage(`Ошибка: ${err.error || 'Ошибка сервера'}`);
    }
  };

  const uploadNewMedia = async (files: File[]) => {
    for (const f of files) {
      const formData = new FormData();
      formData.append('file', f);
      await fetch(`/api/games/${gameId}/media`, { method: 'POST', body: formData });
    }
    const res = await fetch(`/api/games/${gameId}`);
    const data = await res.json();
    setMedia(data.media || []);
  };

  const deleteMedia = async (mediaId: number) => {
    await fetch(`/api/games/${gameId}/media/${mediaId}`, { method: 'DELETE' });
    setMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const deleteGameFile = async (fileId: number) => {
    await fetch(`/api/games/${gameId}/files/${fileId}`, { method: 'DELETE' });
    setGameFiles(prev => prev.filter(f => f.id !== fileId));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  if (!user || (user.role !== 'developer' && user.role !== 'admin')) return <div className="p-8 text-center text-gray-500">Доступ запрещён</div>;

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 transition-colors";
  const fileInputClass =
    "mt-1 block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-200 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 transition-colors cursor-pointer";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Редактирование игры</h1>
      {message && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Жанры</label>
          <GenreMultiSelect selectedIds={genreIds} onChange={setGenreIds} user={user} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Платформы</label>
          <PlatformSelect selectedIds={platformIds} onChange={setPlatformIds} />
        </div>
        {gameFiles.map(file => (
          <div key={file.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span>
              Платформа {file.platformId === 1 ? 'Android' : 'PC'}: {file.url.split('/').pop()}
            </span>
            <button type="button" onClick={() => deleteGameFile(file.id)} className="text-red-600 dark:text-red-400 hover:underline text-xs">
              Удалить
            </button>
          </div>
        ))}
        {platformIds.map(pid => (
          <div key={pid}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Новый файл для {pid === 1 ? 'Android (APK)' : 'PC (EXE)'}
            </label>
            <input
              type="file"
              accept={pid === 1 ? '.apk' : '.exe,.msi'}
              onChange={e => handlePlatformFileChange(pid, e.target.files?.[0] || null)}
              className={fileInputClass}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Доступность игры</label>
          <TierSelect value={requiredTier} onChange={setRequiredTier} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Обложка</label>
          <CoverUploader currentUrl={mediaUrl} onChange={(url) => setMediaUrl(url || '')} />
        </div>
        <fieldset className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Скриншоты и видео</legend>
          <MediaUploader existingMedia={media} onUpload={uploadNewMedia} onDelete={deleteMedia} />
        </fieldset>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Сохранить изменения
        </button>
      </form>
    </div>
  );
}