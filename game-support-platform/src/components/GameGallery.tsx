'use client';
import { useState } from 'react';

interface Media {
  id: number;
  url: string;
  type: string;
}

export default function GameGallery({ media }: { media: Media[] }) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (media.length === 0) return null;

  const openFullscreen = (index: number) => setFullscreenIndex(index);
  const closeFullscreen = () => setFullscreenIndex(null);

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenIndex(prev => (prev === 0 ? media.length - 1 : prev! - 1));
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenIndex(prev => (prev === media.length - 1 ? 0 : prev! + 1));
  };

  return (
    <>
      {/* Горизонтальная карусель скриншотов */}
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
        {media.map((item, index) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-40 sm:w-48 h-24 sm:h-28 rounded-lg overflow-hidden cursor-pointer snap-start bg-black"
            onClick={() => openFullscreen(index)}
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                onMouseLeave={e => (e.target as HTMLVideoElement).pause()}
              />
            ) : (
              <img src={item.url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>

      {/* Полноэкранный просмотр */}
      {fullscreenIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center text-white text-2xl z-10"
          >
            ‹
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center text-white text-2xl z-10"
          >
            ›
          </button>

          {media[fullscreenIndex].type === 'video' ? (
            <video
              src={media[fullscreenIndex].url}
              controls
              className="max-w-full max-h-full"
            />
          ) : (
            <img
              src={media[fullscreenIndex].url}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      )}
    </>
  );
}