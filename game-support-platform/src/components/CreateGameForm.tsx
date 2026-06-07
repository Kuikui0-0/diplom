'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GenreMultiSelect from './GenreMultiSelect';
import CoverUploader from './CoverUploader';
import PlatformSelect from './PlatformSelect';
import TierSelect from './TierSelect';

export default function CreateGameForm() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [platformIds, setPlatformIds] = useState<number[]>([]);
  const [platformFiles, setPlatformFiles] = useState<Record<number, File | null>>({});
  const [requiredTier, setRequiredTier] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  useEffect(() => {
    setPlatformFiles(prev => {
      const newFiles: Record<number, File | null> = {};
      for (const id of platformIds) {
        newFiles[id] = prev[id] ?? null;
      }
      return newFiles;
    });
  }, [platformIds]);

  const handlePlatformFileChange = (platformId: number, file: File | null) => {
    setPlatformFiles(prev => ({ ...prev, [platformId]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || undefined,
        genreIds,
        mediaUrl: mediaUrl || undefined,
        platformIds,
        requiredTier,
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Ошибка сервера';
      try {
        const err = await res.json();
        if (err.error) errorMsg = err.error;
      } catch (e) {}
      setMessage(`Ошибка: ${errorMsg}`);
      return;
    }

    const game = await res.json();
    const gameId = game.id;

    for (const platformId of platformIds) {
      const file = platformFiles[platformId];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('platformId', String(platformId));
        await fetch(`/api/games/${gameId}/files`, { method: 'POST', body: formData });
      }
    }

    if (files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`/api/games/${gameId}/media`, { method: 'POST', body: formData });
      }
    }

    router.push(`/games/${gameId}`);
  };

  if (user === null) return <p>Загрузка...</p>;
  if (!user || (user.role !== 'developer' && user.role !== 'admin')) return null;

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 transition-colors";
  const fileInputClass = "mt-1 block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-200 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 transition-colors cursor-pointer";

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Добавить новую игру</h2>
      {message && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-5">
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
        {platformIds.map(pid => (
          <div key={pid}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Файл для {pid === 1 ? 'Android (APK)' : 'PC (EXE)'}
            </label>
            <input
              type="file"
              accept={pid === 1 ? '.apk' : '.exe,.msi'}
              onChange={e => handlePlatformFileChange(pid, e.target.files?.[0] || null)}
              className={fileInputClass}
            />
            {platformFiles[pid] && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Выбран: {platformFiles[pid]!.name}</p>}
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
          <CoverUploader currentUrl={mediaUrl} onChange={setMediaUrl} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Скриншоты и видео (можно несколько)</label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={e => setFiles(Array.from(e.target.files || []))}
            className={fileInputClass}
          />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((file, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                  {file.name}
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Создать игру
        </button>
      </form>
    </div>
  );
}