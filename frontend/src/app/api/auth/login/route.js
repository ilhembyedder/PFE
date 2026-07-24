import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/crypto';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, tenantId } = body;

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        let res;
        try {
            res = await fetch(`${backendUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, tenantId }),
            });
        } catch (fetchErr) {
            console.error('BFF Login: Impossible de contacter le serveur backend à', backendUrl, fetchErr);
            return NextResponse.json(
                { status: 'error', message: 'Impossible de contacter le serveur backend (Serveur indisponible)' },
                { status: 503 }
            );
        }

        let data;
        try {
            data = await res.json();
        } catch (parseErr) {
            console.error('BFF Login: Réponse backend non-JSON invalide', parseErr);
            return NextResponse.json(
                { status: 'error', message: 'Réponse invalide reçue du serveur backend' },
                { status: 502 }
            );
        }

        if (res.ok && data.status === 'success') {
            const { token, userId, role, name } = data.data || {};

            if (!token) {
                console.error('BFF Login: Jeton d\'authentification manquant dans data.data:', data);
                return NextResponse.json(
                    { status: 'error', message: 'Jeton d\'authentification manquant' },
                    { status: 500 }
                );
            }

            const response = NextResponse.json({
                status: 'success',
                data: { userId, role, name, tenantId }
            });

            const isProd = process.env.NODE_ENV === 'production';
            
            // Encrypt the backend JWT token before setting it in the cookie
            const encryptedToken = await encrypt(token);
            
            // Set session_token as HttpOnly, Secure, SameSite=Strict
            response.cookies.set('session_token', encryptedToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24, // 1 day
            });

            // Set user_session as client-accessible cookie
            response.cookies.set('user_session', JSON.stringify({ userId, role, name, tenantId }), {
                httpOnly: false,
                secure: isProd,
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24, // 1 day
            });

            return response;
        } else {
            return NextResponse.json(
                { status: 'fail', message: data.message || 'Identifiants invalides' },
                { status: res.status }
            );
        }
    } catch (error) {
        console.error('BFF Login erreur non gérée:', error);
        return NextResponse.json(
            { status: 'error', message: 'Une erreur interne est survenue lors de la connexion' },
            { status: 500 }
        );
    }
}
