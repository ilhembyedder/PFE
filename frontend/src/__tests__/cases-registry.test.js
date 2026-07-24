import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CasesRegistryPage from '../app/(dashboard)/cases/page';
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
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
}));

describe('CasesRegistryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders page headers and search filters', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'success', 
          data: { content: [], totalElements: 0 } 
        })
      })
    );

    render(<CasesRegistryPage />);
    
    expect(screen.getByText("Command Center")).toBeInTheDocument();
    expect(screen.getByText("Consultez et filtrez la liste complète de vos dossiers de recouvrement actifs.")).toBeInTheDocument();
    expect(screen.getByText("Nouveau dossier")).toBeInTheDocument();
  });

  test('fetches and displays cases in table successfully', async () => {
    const mockCase = {
      id: 'case-1-uuid',
      clientName: 'Client Alpha',
      contractReference: 'CRT-ALPHA-99',
      currentPhase: 'PRE_CONTENTIEUX',
      assigneeName: 'John Doe',
      reliabilityIndicator: 'RELIABLE',
      lastActionAt: '2026-07-02T19:00:00Z',
      createdAt: '2026-07-02T18:00:00Z'
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'success', 
          data: { content: [mockCase], totalElements: 1 } 
        })
      })
    );

    render(<CasesRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Client Alpha')).toBeInTheDocument();
      expect(screen.getByText('CRT-ALPHA-99')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Fiable')).toBeInTheDocument();
    });
  });

  test('fetches and displays priority alerts on mount', async () => {
    const mockAlert = {
      alertId: 'alert-123',
      caseId: 'case-123',
      clientName: 'Priority Client',
      contractReference: 'CRT-PRIO-00',
      alertType: 'DORMANCY',
      criticality: 'CRITICAL',
      message: 'Priority alert message'
    };

    global.fetch = jest.fn((url) => {
      if (url.includes('/api/dashboard/alerts/priority')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: [mockAlert]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'success', 
          data: { content: [], totalElements: 0 } 
        })
      });
    });

    render(<CasesRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Priority Client')).toBeInTheDocument();
      expect(screen.getByText('(CRT-PRIO-00)')).toBeInTheDocument();
      expect(screen.getByText('Priority alert message')).toBeInTheDocument();
    });
  });
});
