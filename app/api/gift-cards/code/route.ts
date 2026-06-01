import { getServerSession } from 'next-auth/next';
import { nextauthConfig } from '@/lib/nextauth.config';
import { generateSecureGiftCardCode } from '@/lib/gift-card-code';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(nextauthConfig);

  if (!(session?.user as any)?.id) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  return Response.json({ code: generateSecureGiftCardCode() });
}
