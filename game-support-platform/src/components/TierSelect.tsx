'use client';

export default function TierSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (tier: string | null) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
    >
      <option value="">Не требует подписки</option>
      <option value="bronze">Бронзовый уровень</option>
      <option value="silver">Серебряный уровень</option>
      <option value="gold">Золотой уровень</option>
    </select>
  );
}