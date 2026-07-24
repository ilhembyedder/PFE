import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';

export async function PUT(request, { params }) {
    const sessionTokenCookie = request.cookies.get('session_token');
    if (!sessionTokenCookie) {
        return NextResponse.json({ status: 'fail', message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = await decrypt(sessionTokenCookie.value);
    if (!token) {
        return NextResponse.json({ status: 'fail', message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
        
        const res = await fetch(`${backendUrl}/api/v1/super-admin/tenants/${id}/deactivate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        console.error('BFF PUT deactivate tenant error:', e);
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
