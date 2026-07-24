import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';

export async function GET(request, { params }) {
    const { id } = await params;
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
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        const userEmail = payload.sub;
        const tenantId = payload.tenantId;

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        
        const res = await fetch(`${backendUrl}/api/v1/cases/${id}/valuation-progress`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': tenantId,
                'X-User-Email': userEmail
            }
        });

        if (!res.ok) {
            return new Response(res.body, {
                status: res.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const headers = new Headers();
        headers.set('Content-Type', 'text/event-stream');
        headers.set('Cache-Control', 'no-cache, no-transform');
        headers.set('Connection', 'keep-alive');

        return new Response(res.body, {
            status: 200,
            headers: headers
        });
    } catch (e) {
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
