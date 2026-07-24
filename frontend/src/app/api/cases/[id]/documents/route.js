import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';

/**
 * GET /api/cases/[id]/documents
 * Proxy to backend: GET /api/v1/cases/{id}/documents
 */
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
        const res = await fetch(`${backendUrl}/api/v1/cases/${id}/documents`, {
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
 * POST /api/cases/[id]/documents
 * Proxy multipart form data upload to backend: POST /api/v1/cases/{id}/documents
 */
export async function POST(request, { params }) {
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

        // Forward the FormData directly to the backend
        const formData = await request.formData();

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        const res = await fetch(`${backendUrl}/api/v1/cases/${id}/documents`, {
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
