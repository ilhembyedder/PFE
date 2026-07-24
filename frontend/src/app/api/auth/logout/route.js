import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({
        status: 'success',
        message: 'Logged out successfully'
    });

    // Clear session cookies
    response.cookies.set('session_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('user_session', '', { path: '/', maxAge: 0 });

    return response;
}
