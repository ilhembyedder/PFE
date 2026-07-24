import { NextResponse } from 'next/server';
import { decrypt } from './lib/crypto';

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    
    const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

    if (isProtected) {
        const sessionToken = request.cookies.get('session_token');
        
        if (!sessionToken) {
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Validate that the encrypted token can be decrypted successfully
        const decrypted = await decrypt(sessionToken.value);
        if (!decrypted) {
            const loginUrl = new URL('/login', request.url);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.delete('session_token');
            response.cookies.delete('user_session');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
};
