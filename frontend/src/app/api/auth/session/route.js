import { NextResponse } from 'next/server';

export async function GET(request) {
    const sessionCookie = request.cookies.get('user_session');
    
    if (!sessionCookie) {
        return NextResponse.json(
            { status: 'fail', message: 'No active session' },
            { status: 401 }
        );
    }

    try {
        const session = JSON.parse(sessionCookie.value);
        return NextResponse.json({
            status: 'success',
            data: session
        });
    } catch (e) {
        return NextResponse.json(
            { status: 'error', message: 'Invalid session' },
            { status: 400 }
        );
    }
}
