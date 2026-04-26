import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { origin } = new URL(request.url);
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Generar un 'state' aleatorio para prevenir ataques CSRF
    const state = Math.random().toString(36).substring(2, 15);

    // Guardar el state en una cookie para verificarlo en el callback
    const cookieStore = await cookies();
    cookieStore.set('google_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutos
        path: '/',
    });

    // Construir la URL de autorización de Google
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: state,
        access_type: 'online',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.redirect(googleAuthUrl);
}
