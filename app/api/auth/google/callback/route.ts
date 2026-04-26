import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users, stores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
        return NextResponse.redirect(new URL('/auth/login?error=cancelled', request.url));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/auth/login?error=missing_params', request.url));
    }

    const cookieStore = await cookies();
    const savedState = cookieStore.get('google_oauth_state')?.value;

    if (!savedState || savedState !== state) {
        console.warn('[Google OAuth] State no coincide o no existe.');
        return NextResponse.redirect(new URL('/auth/login?error=invalid_state', request.url));
    }

    cookieStore.set('google_oauth_state', '', { maxAge: 0, path: '/' });

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID!;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        const { origin } = new URL(request.url);
        const redirectUri = `${origin}/api/auth/google/callback`;

        // 1. Intercambiar código por access_token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            console.error('[Google OAuth] Error token exchange');
            return NextResponse.redirect(new URL('/auth/login?error=token_exchange', request.url));
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Obtener perfil
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userInfoResponse.ok) {
            return NextResponse.redirect(new URL('/auth/login?error=userinfo_failed', request.url));
        }

        const googleUser = await userInfoResponse.json();
        const { sub: providerId, email, name } = googleUser;

        if (!email) {
            return NextResponse.redirect(new URL('/auth/login?error=no_email', request.url));
        }

        // 3. DB Sync
        let user = await db.select().from(users).where(eq(users.email, email)).get();

        if (!user) {
            const userId = randomUUID();
            await db.insert(users).values({
                id: userId,
                email,
                name: name || 'Usuario Google',
                role: 'seller',
                provider: 'google',
                createdAt: new Date(),
            });

            // Crear tienda automática
            await db.insert(stores).values({
                id: randomUUID(),
                userId: userId,
                name: `Tienda de ${name || email}`,
                description: "Bienvenido a tu nueva tienda",
                verified: false,
                createdAt: new Date(),
            });

            user = await db.select().from(users).where(eq(users.id, userId)).get();
        } else if (!user.provider) {
            await db.update(users)
                .set({ provider: 'google' })
                .where(eq(users.id, user.id));
        }

        if (!user) throw new Error("User creation failed");

        // 4. Cookies para proxy.ts
        cookieStore.set('session_id', randomUUID(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        cookieStore.set('user_id', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        cookieStore.set('user_role', user.role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        cookieStore.set('user_name', user.name, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (error) {
        console.error('[Google OAuth] Error:', error);
        return NextResponse.redirect(new URL('/auth/login?error=server_error', request.url));
    }
}
