import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';

/**
 * GET /api/cases/[id]/documents/[docId]/download
 * Proxy binary file stream from backend: GET /api/v1/cases/{id}/documents/{docId}/download
 */
export async function GET(request, { params }) {
    const { id, docId } = await params;
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
        const res = await fetch(`${backendUrl}/api/v1/cases/${id}/documents/${docId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': tenantId,
                'X-User-Email': userEmail
            }
        });

        if (!res.ok) {
            return NextResponse.json({ status: 'error', message: 'File not found' }, { status: res.status });
        }

        // Stream the binary response with correct headers
        const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
        const contentDisposition = res.headers.get('Content-Disposition') || 'attachment';
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': contentDisposition
            }
        });
    } catch (e) {
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
