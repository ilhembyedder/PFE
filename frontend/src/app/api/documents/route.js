import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';

/**
 * GET /api/documents?entityType=...&entityId=...
 * Proxy to backend: GET /api/v1/documents?entityType=...&entityId=...
 */
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
        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');

        if (!entityType || !entityId) {
            return NextResponse.json({ status: 'fail', message: 'Missing entityType or entityId parameters' }, { status: 400 });
        }

        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        const userEmail = payload.sub;
        const tenantId = payload.tenantId;

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        const res = await fetch(`${backendUrl}/api/v1/documents?entityType=${entityType}&entityId=${entityId}`, {
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

/**
 * POST /api/documents
 * Proxy multipart form data upload to backend: POST /api/v1/documents
 */
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
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        const userEmail = payload.sub;
        const tenantId = payload.tenantId;

        // Forward the FormData directly to the backend
        const formData = await request.formData();

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        const res = await fetch(`${backendUrl}/api/v1/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': tenantId,
                'X-User-Email': userEmail
                // Do NOT set Content-Type here; fetch will set multipart/form-data with boundary automatically
            },
            body: formData
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
