import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload;
        try {
          payload = typeof clientPayload === 'string' ? JSON.parse(clientPayload) : clientPayload;
        } catch {
          payload = {};
        }

        const { gameId, platformId, filename } = payload;
        if (!filename || !gameId || !platformId) {
          throw new Error('Missing required fields in clientPayload');
        }

        // Аутентификация и авторизация уже проверены выше
        return {
          allowedContentTypes: [
            'application/zip',
            'application/x-msdownload',
            'application/vnd.android.package-archive',
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.userId, gameId, platformId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Этот колбэк вызывается Vercel Blob после успешной загрузки
        // Здесь можно обновить базу данных, но мы уже сохраняем URL в клиенте
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}