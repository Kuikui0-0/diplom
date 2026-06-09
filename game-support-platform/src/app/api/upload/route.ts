import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
    }

    // Разрешить только изображения для аватара
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Неподдерживаемый тип файла' }, { status: 400 });
    }

    const maxSize = 4.5 * 1024 * 1024; // 4.5 МБ – лимит Vercel бесплатного тарифа
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Файл слишком большой (макс. 4.5 МБ)' }, { status: 400 });
    }

    const blob = await put(`covers/${Date.now()}-${file.name}`, file, { access: 'public' });
    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}