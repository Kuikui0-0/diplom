'use client';
import { useState, useEffect } from 'react';

interface Platform {
  id: number;
  name: string;
}

export default function PlatformSelect({
  selectedIds,
  onChange,
}: {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    fetch('/api/platforms')
      .then(res => res.json())
      .then(data => setPlatforms(data))
      .catch(() => setPlatforms([]));
  }, []);

  const togglePlatform = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(pid => pid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.length === 0 && <p className="text-sm text-gray-500">Загрузка платформ...</p>}
      {platforms.map(p => (
        <button
          type="button"
          key={p.id}
          onClick={() => togglePlatform(p.id)}
          className={`px-3 py-1 rounded-full text-sm border ${
            selectedIds.includes(p.id)
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}