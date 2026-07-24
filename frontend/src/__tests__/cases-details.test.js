import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CaseDetailsPage from '../app/(dashboard)/cases/[id]/page';
import '@testing-library/jest-dom';

// Setup window.matchMedia mock and MessageChannel/ResizeObserver polyfills for AntD
beforeAll(() => {
  class MessageChannelPolyfill {
    constructor() {
      this.port1 = {
        onmessage: null,
        postMessage: (data) => {
          if (this.port2.onmessage) {
            setTimeout(() => this.port2.onmessage({ data }), 0);
          }
        }
      };
      this.port2 = {
        onmessage: null,
        postMessage: (data) => {
          if (this.port1.onmessage) {
            setTimeout(() => this.port1.onmessage({ data }), 0);
          }
        }
      };
    }
  }
  global.MessageChannel = MessageChannelPolyfill;

  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserverPolyfill;

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

const mockPush = jest.fn();
const mockGet = jest.fn(() => null);
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
  useSearchParams() {
    return {
      get: mockGet,
    };
  },
}));

describe('CaseDetailsPage', () => {
  const paramsPromise = Promise.resolve({ id: 'case-uuid-123' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation(() => null);
  });

  test('renders case details successfully after loading', async () => {
    // Mock APIs
    global.fetch = jest.fn((url) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/assignees')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/prerequisites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              nextPhase: 'MISE_EN_DEMEURE',
              isBlocked: false,
              missingPrerequisites: []
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: {
            id: 'case-uuid-123',
            status: 'ACTIVE',
            currentPhase: 'PRE_CONTENTIEUX',
            initialResidualValueCents: 500000,
            currencyCode: 'TND',
            client: { fullNameOrCompany: 'Société Alpha' },
            contract: { referenceNumber: 'CRT-123' },
            vehicle: { brand: 'Peugeot', model: '3008', vin: 'VF123' }
          }
        })
      });
    });

    render(<CaseDetailsPage params={paramsPromise} />);

    // Expect loading spinner
    expect(screen.getByText('Chargement des détails du dossier...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dossier : CRT-123')).toBeInTheDocument();
      expect(screen.getByText('Société Alpha')).toBeInTheDocument();
      expect(screen.getByText('Peugeot 3008')).toBeInTheDocument();
    });
  });

  test('renders blocked step and blocker banner when prerequisites are missing', async () => {
    // Mock APIs
    global.fetch = jest.fn((url) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/assignees')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/prerequisites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              nextPhase: 'MISE_EN_DEMEURE',
              isBlocked: true,
              missingPrerequisites: ['Pièce justificative manquante']
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: {
            id: 'case-uuid-123',
            status: 'ACTIVE',
            currentPhase: 'PRE_CONTENTIEUX',
            initialResidualValueCents: 500000,
            currencyCode: 'TND',
            client: { fullNameOrCompany: 'Société Alpha' },
            contract: { referenceNumber: 'CRT-123' },
            vehicle: { brand: 'Peugeot', model: '3008', vin: 'VF123' }
          }
        })
      });
    });

    render(<CaseDetailsPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Dossier : CRT-123')).toBeInTheDocument();
    });

    // Check that warning banner is displayed
    expect(screen.getByText('Progression de phase bloquée - Prérequis requis manquants')).toBeInTheDocument();
    expect(screen.getByText('Pièce justificative manquante')).toBeInTheDocument();
    
    // Check that "Avancer la phase" button is disabled
    const advanceButton = screen.getByRole('button', { name: /Avancer la phase/i });
    expect(advanceButton).toBeDisabled();
  });

  test('disables comment button when note content is empty or whitespace only', async () => {
    // Mock APIs
    global.fetch = jest.fn((url) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/assignees')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/prerequisites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              nextPhase: 'MISE_EN_DEMEURE',
              isBlocked: false,
              missingPrerequisites: []
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: {
            id: 'case-uuid-123',
            status: 'ACTIVE',
            currentPhase: 'PRE_CONTENTIEUX',
            initialResidualValueCents: 500000,
            currencyCode: 'TND',
            client: { fullNameOrCompany: 'Société Alpha' },
            contract: { referenceNumber: 'CRT-123' },
            vehicle: { brand: 'Peugeot', model: '3008', vin: 'VF123' }
          }
        })
      });
    });

    render(<CaseDetailsPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Dossier : CRT-123')).toBeInTheDocument();
    });

    // Click the Notes tab
    const notesTab = screen.getByText('Notes & Commentaires');
    fireEvent.click(notesTab);

    // Locate elements
    const textArea = screen.getByPlaceholderText('Écrire un commentaire sur ce dossier...');
    const submitButton = screen.getByRole('button', { name: /Commenter/i });

    // Assert initially disabled
    expect(submitButton).toBeDisabled();

    // Type whitespace
    fireEvent.change(textArea, { target: { value: '   ' } });
    expect(submitButton).toBeDisabled();

    // Type text
    fireEvent.change(textArea, { target: { value: 'Valid note content' } });
    expect(submitButton).not.toBeDisabled();
  });

  test('renders case history events under Historique tab', async () => {
    const historyData = [
      {
        eventType: 'CASE_CREATED',
        timestamp: '2026-06-30T16:00:00Z',
        actor: 'system-actor@example.com',
        description: 'Dossier initialisé avec succès'
      },
      {
        eventType: 'PHASE_TRANSITION',
        timestamp: '2026-06-30T17:00:00Z',
        actor: 'gestionnaire@example.com',
        description: 'Phase avancée de PRE_CONTENTIEUX à MISE_EN_DEMEURE'
      }
    ];

    // Mock APIs
    global.fetch = jest.fn((url) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: historyData })
        });
      }
      if (url.includes('/assignees')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/prerequisites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              nextPhase: 'MISE_EN_DEMEURE',
              isBlocked: false,
              missingPrerequisites: []
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: {
            id: 'case-uuid-123',
            status: 'ACTIVE',
            currentPhase: 'PRE_CONTENTIEUX',
            initialResidualValueCents: 500000,
            currencyCode: 'TND',
            client: { fullNameOrCompany: 'Société Alpha' },
            contract: { referenceNumber: 'CRT-123' },
            vehicle: { brand: 'Peugeot', model: '3008', vin: 'VF123' }
          }
        })
      });
    });

    render(<CaseDetailsPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Dossier : CRT-123')).toBeInTheDocument();
    });

    // Click the Historique tab
    const historyTab = screen.getByText('Historique');
    fireEvent.click(historyTab);

    // Verify history events render
    await waitFor(() => {
      expect(screen.getByText('🆕 Dossier Créé')).toBeInTheDocument();
      expect(screen.getByText('Dossier initialisé avec succès')).toBeInTheDocument();
      expect(screen.getByText('Par : system-actor@example.com')).toBeInTheDocument();

      expect(screen.getByText('🔄 Transition de Phase')).toBeInTheDocument();
      expect(screen.getByText('Phase avancée de PRE_CONTENTIEUX à MISE_EN_DEMEURE')).toBeInTheDocument();
      expect(screen.getByText('Par : gestionnaire@example.com')).toBeInTheDocument();
    });
  });

  test('triggers PDF export download when clicking Exporter PDF button', async () => {
    // Mock window.URL methods
    const createObjectURL = jest.fn(() => 'mock-url');
    const revokeObjectURL = jest.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    // Mock fetch for export call
    global.fetch = jest.fn((url) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/assignees')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/prerequisites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              nextPhase: 'MISE_EN_DEMEURE',
              isBlocked: false,
              missingPrerequisites: []
            }
          })
        });
      }
      if (url.includes('/export')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['PDF Content'], { type: 'application/pdf' }))
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: {
            id: 'case-uuid-123',
            status: 'ACTIVE',
            currentPhase: 'PRE_CONTENTIEUX',
            initialResidualValueCents: 500000,
            currencyCode: 'TND',
            client: { fullNameOrCompany: 'Société Alpha' },
            contract: { referenceNumber: 'CRT-123' },
            vehicle: { brand: 'Peugeot', model: '3008', vin: 'VF123' }
          }
        })
      });
    });

    render(<CaseDetailsPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Dossier : CRT-123')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /Exporter PDF/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/cases/case-uuid-123/export');
      expect(createObjectURL).toHaveBeenCalled();
    });
  });

  test('hides Avancer la phase button when case is in CLOTURE phase', async () => {
    // Mock APIs
    global.fetch = jest.fn((url) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/assignees')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/prerequisites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              nextPhase: null,
              isBlocked: false,
              missingPrerequisites: []
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: {
            id: 'case-uuid-123',
            status: 'ACTIVE',
            currentPhase: 'CLOTURE',
            initialResidualValueCents: 500000,
            currencyCode: 'TND',
            client: { fullNameOrCompany: 'Société Alpha' },
            contract: { referenceNumber: 'CRT-123' },
            vehicle: { brand: 'Peugeot', model: '3008', vin: 'VF123' }
          }
        })
      });
    });

    render(<CaseDetailsPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Dossier : CRT-123')).toBeInTheDocument();
    });

    // Check that "Avancer la phase" button is NOT in the document
    const advanceButton = screen.queryByRole('button', { name: /Avancer la phase/i });
    expect(advanceButton).toBeNull();
  });

  test('sets active tab key to notes if tab parameter is notes', async () => {
    mockGet.mockImplementation((param) => {
      if (param === 'tab') return 'notes';
      return null;
    });

    // Mock APIs
    global.fetch = jest.fn((url) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/assignees')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: [] })
        });
      }
      if (url.includes('/prerequisites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              nextPhase: 'MISE_EN_DEMEURE',
              isBlocked: false,
              missingPrerequisites: []
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          data: {
            id: 'case-uuid-123',
            status: 'ACTIVE',
            currentPhase: 'PRE_CONTENTIEUX',
            initialResidualValueCents: 500000,
            currencyCode: 'TND',
            client: { fullNameOrCompany: 'Société Alpha' },
            contract: { referenceNumber: 'CRT-123' },
            vehicle: { brand: 'Peugeot', model: '3008', vin: 'VF123' }
          }
        })
      });
    });

    render(<CaseDetailsPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Dossier : CRT-123')).toBeInTheDocument();
    });

    // Check that Notes tab content is active (e.g., has the comment button)
    expect(screen.getByRole('button', { name: /Commenter/i })).toBeInTheDocument();
  });
});
