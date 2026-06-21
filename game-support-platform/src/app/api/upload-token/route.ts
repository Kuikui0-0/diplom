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
        let payload = {};
        if (clientPayload) {
          try {
            payload = JSON.parse(clientPayload as string);
          } catch {
            payload = {};
          }
        }
        const { gameId, platformId, filename } = payload as any;
        if (!filename || !gameId || !platformId) {
          throw new Error('Missing required fields in clientPayload');
        }

        return {
          allowedContentTypes: ['*/*'],
          tokenPayload: JSON.stringify({ userId: session.userId, gameId, platformId }),
          multipart: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('File uploaded:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload token error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}