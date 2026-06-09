import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Неподдерживаемый тип файла' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Файл слишком большой (макс. 10 МБ)' }, { status: 400 });
    }

    // Загружаем в Vercel Blob
    const blob = await put(file.name, file, { access: 'public' });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}