import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AIUploadZone from '../features/cases/components/AIUploadZone';
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

// -----------------------------------------------------------------------
// Helper: Mock global.fetch for document upload
// -----------------------------------------------------------------------
const mockSuccessfulUpload = () => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            status: 201,
            json: async () => ({ status: 'success', data: { id: 'doc-uuid', fileName: 'test.pdf' } })
        })
    );
};

const mockFailedUpload = (message = 'Impossible d\'importer le document.') => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ status: 'error', message })
        })
    );
};

// -----------------------------------------------------------------------
// Helper: Mock EventSource for SSE progress stream
// -----------------------------------------------------------------------
let mockEventSourceInstance;

class MockEventSource {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;

    constructor(url) {
        this.url = url;
        this.listeners = {};
        this.onerror = null;
        this.closed = false;
        this.readyState = 0;
        mockEventSourceInstance = this;
    }

    addEventListener(event, handler) {
        this.listeners[event] = handler;
    }

    dispatchProgress(data) {
        this.readyState = 1;
        if (this.listeners['progress']) {
            this.listeners['progress']({ data: JSON.stringify(data) });
        }
    }

    triggerError() {
        this.readyState = 2;
        if (this.onerror) {
            this.onerror(new Event('error'));
        }
    }

    close() {
        this.closed = true;
        this.readyState = 2;
    }
}

MockEventSource.CONNECTING = 0;
MockEventSource.OPEN = 1;
MockEventSource.CLOSED = 2;

beforeEach(() => {
    global.EventSource = MockEventSource;
    jest.clearAllMocks();
});

// -----------------------------------------------------------------------
// Helper: Simulate a file upload via the AntD Dragger's hidden input
// -----------------------------------------------------------------------
async function simulateFileUpload(container) {
    const input = container.querySelector('input[type="file"]');
    const file = new File(['%PDF-1.4 mock pdf'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
    });
    return file;
}

// -----------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------
describe('AIUploadZone Component', () => {

    test('renders the drag-and-drop zone initially', () => {
        const { container } = render(<AIUploadZone caseId="case-uuid" phaseKey="SAISIE" />);
        expect(screen.getByText(/Glissez-déposez le rapport d'expertise/)).toBeInTheDocument();
        // Dragger input should be present
        expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    test('shows success state and calls onUploadSuccess for non-SAISIE phase', async () => {
        mockSuccessfulUpload();
        const onUploadSuccess = jest.fn();
        const { container } = render(
            <AIUploadZone caseId="case-uuid" phaseKey="PRE_CONTENTIEUX" onUploadSuccess={onUploadSuccess} />
        );

        await simulateFileUpload(container);

        await waitFor(() => {
            expect(onUploadSuccess).toHaveBeenCalledTimes(1);
        });
    });

    test('shows error Alert banner in the component when upload HTTP request fails', async () => {
        mockFailedUpload('Impossible d\'importer le document.');
        const { container } = render(<AIUploadZone caseId="case-uuid" phaseKey="PRE_CONTENTIEUX" />);

        await simulateFileUpload(container);

        await waitFor(() => {
            // The AntD Alert's title should appear
            expect(screen.getByText('Échec du traitement')).toBeInTheDocument();
            // The Alert description element should contain the error
            const alertDescription = container.querySelector('.ant-alert-description');
            expect(alertDescription).toBeInTheDocument();
            expect(alertDescription.textContent).toContain('Impossible d\'importer le document.');
        });
    });

    test('shows error Alert when SSE stream signals FAILED status (AC: #1)', async () => {
        mockSuccessfulUpload();
        const { container } = render(<AIUploadZone caseId="case-uuid" phaseKey="SAISIE" />);

        await simulateFileUpload(container);

        // Wait for the SSE connection to be established
        await waitFor(() => {
            expect(mockEventSourceInstance).toBeDefined();
        });

        // Simulate the AI pipeline sending a FAILED event
        await act(async () => {
            mockEventSourceInstance.dispatchProgress({
                status: 'FAILED',
                stage: 'EXTRACTION',
                progress: 100,
                message: 'Le document est illisible ou n\'est pas un rapport d\'expertise valide.',
                data: null
            });
        });

        await waitFor(() => {
            // Error Alert should be displayed
            expect(screen.getByText('Échec du traitement')).toBeInTheDocument();
            // Check the alert description container specifically
            const alertDescription = container.querySelector('.ant-alert-description');
            expect(alertDescription).toBeInTheDocument();
            expect(alertDescription.textContent).toContain('Le document est illisible');
            // EventSource should be closed
            expect(mockEventSourceInstance.closed).toBe(true);
        });
    });

    test('does NOT render progress bar when FAILED status received (AC: #1)', async () => {
        mockSuccessfulUpload();
        const { container } = render(<AIUploadZone caseId="case-uuid" phaseKey="SAISIE" />);

        await simulateFileUpload(container);

        await waitFor(() => {
            expect(mockEventSourceInstance).toBeDefined();
        });

        await act(async () => {
            mockEventSourceInstance.dispatchProgress({
                status: 'FAILED',
                message: 'Le document est illisible ou n\'est pas un rapport d\'expertise valide.',
            });
        });

        await waitFor(() => {
            // The progress bar (ant-progress) should NOT be in the document
            expect(container.querySelector('.ant-progress')).not.toBeInTheDocument();
            // The error Alert should be present instead
            expect(container.querySelector('.ant-alert-error')).toBeInTheDocument();
        });
    });

    test('clicking Réessayer button resets state and restores drop zone (AC: #1, FR26)', async () => {
        mockSuccessfulUpload();
        const { container } = render(<AIUploadZone caseId="case-uuid" phaseKey="SAISIE" />);

        await simulateFileUpload(container);

        await waitFor(() => {
            expect(mockEventSourceInstance).toBeDefined();
        });

        // Trigger FAILED event
        await act(async () => {
            mockEventSourceInstance.dispatchProgress({
                status: 'FAILED',
                message: 'Le document est illisible ou n\'est pas un rapport d\'expertise valide.',
            });
        });

        // Wait for the retry button to appear
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Réessayer/i })).toBeInTheDocument();
        });

        // Click the Retry / New Document button
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Réessayer/i }));
        });

        // After reset, the drag-and-drop zone should be visible again
        await waitFor(() => {
            expect(screen.getByText(/Glissez-déposez le rapport d'expertise/)).toBeInTheDocument();
        });

        // And the error Alert should be gone
        expect(screen.queryByText('Échec du traitement')).not.toBeInTheDocument();
    });

    test('shows error Alert and retry button when EventSource connection fails', async () => {
        mockSuccessfulUpload();
        const { container } = render(<AIUploadZone caseId="case-uuid" phaseKey="SAISIE" />);

        await simulateFileUpload(container);

        await waitFor(() => {
            expect(mockEventSourceInstance).toBeDefined();
        });

        // Dispatch initial progress so receivedEvent becomes true
        await act(async () => {
            mockEventSourceInstance.dispatchProgress({
                status: 'PROCESSING',
                progress: 10
            });
        });

        // Trigger a network-level EventSource error
        await act(async () => {
            mockEventSourceInstance.triggerError();
        });

        await waitFor(() => {
            expect(container.querySelector('.ant-alert-error')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Réessayer/i })).toBeInTheDocument();
        });
    });
});
