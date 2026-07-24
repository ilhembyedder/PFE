import { middleware } from '../middleware';
import { NextResponse } from 'next/server';

// Mock next/server
jest.mock('next/server', () => {
    return {
        NextResponse: {
            next: jest.fn(() => ({ status: 'next' })),
            redirect: jest.fn((url) => {
                const response = { status: 'redirect', url };
                response.cookies = {
                    delete: jest.fn()
                };
                return response;
            }),
        },
    };
});

// Mock crypto helper
jest.mock('../lib/crypto', () => {
    return {
        decrypt: jest.fn(async (val) => {
            if (val === 'valid-jwt-token') {
                return 'decrypted-token';
            }
            return null;
        })
    };
});

describe('Next.js Frontend Auth Middleware & BFF Routing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Middleware redirects unauthenticated user to /login when accessing protected /dashboard', async () => {
        const mockRequest = {
            nextUrl: {
                pathname: '/dashboard/cases',
            },
            url: 'http://localhost:3000/dashboard/cases',
            cookies: {
                get: jest.fn((name) => {
                    if (name === 'session_token') return null;
                    return null;
                }),
            },
        };

        const result = await middleware(mockRequest);

        expect(mockRequest.cookies.get).toHaveBeenCalledWith('session_token');
        expect(NextResponse.redirect).toHaveBeenCalledWith(
            new URL('/login', 'http://localhost:3000/dashboard/cases')
        );
        expect(result.status).toBe('redirect');
    });

    test('Middleware allows access to protected /dashboard when session_token cookie is present', async () => {
        const mockRequest = {
            nextUrl: {
                pathname: '/dashboard/cases',
            },
            url: 'http://localhost:3000/dashboard/cases',
            cookies: {
                get: jest.fn((name) => {
                    if (name === 'session_token') return { value: 'valid-jwt-token' };
                    return null;
                }),
            },
        };

        const result = await middleware(mockRequest);

        expect(mockRequest.cookies.get).toHaveBeenCalledWith('session_token');
        expect(NextResponse.next).toHaveBeenCalled();
        expect(result.status).toBe('next');
    });

    test('Middleware ignores unprotected login route', async () => {
        const mockRequest = {
            nextUrl: {
                pathname: '/login',
            },
            url: 'http://localhost:3000/login',
            cookies: {
                get: jest.fn(),
            },
        };

        const result = await middleware(mockRequest);

        expect(mockRequest.cookies.get).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
        expect(result.status).toBe('next');
    });
});
