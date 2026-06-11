// src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Добро пожаловать на платформу поддержки игр
      </h1>
      <Link href="/games" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
        Перейти в каталог игр
      </Link>
    </div>
  );
}