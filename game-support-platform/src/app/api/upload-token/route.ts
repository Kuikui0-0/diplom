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

        // Здесь можно добавить дополнительные проверки прав доступа
        return {
          allowedContentTypes: [
            'application/octet-stream',
            'application/x-msdownload',      // для .exe
            'application/vnd.android.package-archive', // для .apk
            'application/zip',
            'application/x-msi',
          ],
          addRandomSuffix: false, // сохраняет исходное имя файла
          tokenPayload: JSON.stringify({ userId: session.userId, gameId, platformId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Здесь можно добавить логирование или дополнительные действия (например, сохранить URL в БД)
        console.log('Upload completed:', blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload token error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}