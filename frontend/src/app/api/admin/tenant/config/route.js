import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';

export async function GET(request) {
    const sessionTokenCookie = request.cookies.get('session_token');
    if (!sessionTokenCookie) {
        return NextResponse.json({ status: 'fail', message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = await decrypt(sessionTokenCookie.value);
    if (!token) {
        return NextResponse.json({ status: 'fail', message: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    try {
        const res = await fetch(`${backendUrl}/api/v1/admin/tenant/config`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    const sessionTokenCookie = request.cookies.get('session_token');
    if (!sessionTokenCookie) {
        return NextResponse.json({ status: 'fail', message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = await decrypt(sessionTokenCookie.value);
    if (!token) {
        return NextResponse.json({ status: 'fail', message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        const res = await fetch(`${backendUrl}/api/v1/admin/tenant/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
