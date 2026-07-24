import { ReadableStream } from 'stream/web';
import { TextEncoder } from 'util';

global.ReadableStream = ReadableStream;
global.TextEncoder = TextEncoder;

// Mock next/server BEFORE imports
jest.mock('next/server', () => {
    return {
        NextResponse: {
            json: jest.fn((body, init) => {
                return {
                    status: init?.status || 200,
                    json: async () => body
                };
            })
        }
    };
});

import { GET } from '../app/api/cases/[id]/progress/route';
import { NextResponse } from 'next/server';

// Mock crypto helper
jest.mock('../lib/crypto', () => {
    return {
        decrypt: jest.fn(async (val) => {
            if (val === 'valid-session-token') {
                const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
                const payload = Buffer.from(JSON.stringify({ sub: 'user@example.com', tenantId: 'tenant-uuid' })).toString('base64');
                return `${header}.${payload}.signature`;
            }
            return null;
        })
    };
});

describe('Next.js BFF Progress API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 401 if session cookie is missing', async () => {
        const mockRequest = {
            cookies: {
                get: jest.fn(() => null)
            }
        };
        const mockParams = { params: Promise.resolve({ id: 'case-uuid' }) };

        const response = await GET(mockRequest, mockParams);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.status).toBe('fail');
        expect(data.message).toBe('Unauthorized');
    });

    test('returns 401 if session token is invalid', async () => {
        const mockRequest = {
            cookies: {
                get: jest.fn(() => ({ value: 'invalid-token' }))
            }
        };
        const mockParams = { params: Promise.resolve({ id: 'case-uuid' }) };

        const response = await GET(mockRequest, mockParams);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.status).toBe('fail');
        expect(data.message).toBe('Unauthorized');
    });

    test('successfully forwards authorized requests to backend and returns event stream', async () => {
        const mockRequest = {
            cookies: {
                get: jest.fn(() => ({ value: 'valid-session-token' }))
            }
        };
        const mockParams = { params: Promise.resolve({ id: 'case-uuid' }) };

        const mockStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('data: {"progress": 10}\n\n'));
                controller.close();
            }
        });

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                body: mockStream
            })
        );

        const originalResponse = global.Response;
        const mockResponseInstance = {
            status: 200,
            headers: {
                get: jest.fn((name) => {
                    if (name === 'Content-Type') return 'text/event-stream';
                    return null;
                })
            }
        };
        global.Response = jest.fn(() => mockResponseInstance);

        try {
            const response = await GET(mockRequest, mockParams);

            expect(response.status).toBe(200);
            expect(response.headers.get('Content-Type')).toBe('text/event-stream');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/cases/case-uuid/valuation-progress'),
                expect.objectContaining({
                    headers: {
                        'Authorization': expect.stringContaining('Bearer '),
                        'X-Tenant-ID': 'tenant-uuid',
                        'X-User-Email': 'user@example.com'
                    }
                })
            );
        } finally {
            global.Response = originalResponse;
        }
    });
});
