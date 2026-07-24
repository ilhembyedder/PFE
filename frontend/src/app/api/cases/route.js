import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';

export async function POST(request) {
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
        
        // Decode JWT payload to extract user email and tenantId
        const parts = token.split('.');
        if (parts.length !== 3) {
            return NextResponse.json({ status: 'fail', message: 'Invalid session token' }, { status: 400 });
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        const userEmail = payload.sub;
        const tenantId = payload.tenantId;

        if (!userEmail || !tenantId) {
            return NextResponse.json({ status: 'fail', message: 'Session claims missing' }, { status: 400 });
        }

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        const res = await fetch(`${backendUrl}/api/v1/cases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': tenantId,
                'X-User-Email': userEmail
            },
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request) {
    const sessionTokenCookie = request.cookies.get('session_token');
    if (!sessionTokenCookie) {
        return NextResponse.json({ status: 'fail', message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = await decrypt(sessionTokenCookie.value);
    if (!token) {
        return NextResponse.json({ status: 'fail', message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return NextResponse.json({ status: 'fail', message: 'Invalid session token' }, { status: 400 });
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        const userEmail = payload.sub;
        const tenantId = payload.tenantId;

        if (!userEmail || !tenantId) {
            return NextResponse.json({ status: 'fail', message: 'Session claims missing' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.toString();

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        const targetUrl = `${backendUrl}/api/v1/cases${query ? `?${query}` : ''}`;

        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': tenantId,
                'X-User-Email': userEmail
            }
        });
        
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
