import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EntityDocumentVault from '../features/cases/components/EntityDocumentVault';
import '@testing-library/jest-dom';

// Setup window.matchMedia mock for AntD
beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
});

const mockDocuments = [
    { id: 'doc-1', fileName: 'kbis.pdf', createdAt: '2026-07-04T12:00:00Z', uploaderName: 'Jean Dupont', fileUrl: '/api/documents/doc-1/download' }
];

const mockGetDocumentsSuccess = () => {
    global.fetch = jest.fn((url) => {
        if (url.includes('/api/documents?entityType=client')) {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: async () => ({ status: 'success', data: mockDocuments })
            });
        }
        if (url.includes('/api/documents') && requestMethodIsPost()) {
            return Promise.resolve({
                ok: true,
                status: 201,
                json: async () => ({ status: 'success', data: { id: 'doc-2', fileName: 'new.pdf' } })
            });
        }
        return Promise.reject(new Error('Unknown url: ' + url));
    });
};

const requestMethodIsPost = () => {
    // Helper to check if fetch was called with POST
    return global.fetch.mock.calls.some(call => call[1] && call[1].method === 'POST');
};

beforeEach(() => {
    jest.clearAllMocks();
});

async function simulateFileUpload(container, filename = 'new.pdf', type = 'application/pdf', size = 1000) {
    const input = container.querySelector('input[type="file"]');
    const file = new File(['mock content'], filename, { type });
    Object.defineProperty(file, 'size', { value: size, configurable: true });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });
    return file;
}

describe('EntityDocumentVault Component', () => {

    test('renders file list and shows documents correctly', async () => {
        mockGetDocumentsSuccess();
        render(<EntityDocumentVault entityType="client" entityId="client-uuid" />);

        // Should show loader or load documents
        await waitFor(() => {
            expect(screen.getByText('kbis.pdf')).toBeInTheDocument();
            expect(screen.getByText(/Ajouté le/)).toBeInTheDocument();
            expect(screen.getByText(/par Jean Dupont/)).toBeInTheDocument();
        });
    });

    test('rejects files larger than 10MB client-side', async () => {
        mockGetDocumentsSuccess();
        const { container } = render(<EntityDocumentVault entityType="client" entityId="client-uuid" />);

        // 11MB file
        await simulateFileUpload(container, 'large.pdf', 'application/pdf', 11 * 1024 * 1024);

        // Upload should not have been called
        expect(global.fetch).not.toHaveBeenCalledWith('/api/documents', expect.objectContaining({
            method: 'POST'
        }));
    });

    test('rejects unsupported file formats client-side', async () => {
        mockGetDocumentsSuccess();
        const { container } = render(<EntityDocumentVault entityType="client" entityId="client-uuid" />);

        // Executable file
        await simulateFileUpload(container, 'malware.exe', 'application/octet-stream', 1000);

        // Upload should not have been called
        expect(global.fetch).not.toHaveBeenCalledWith('/api/documents', expect.objectContaining({
            method: 'POST'
        }));
    });
});
