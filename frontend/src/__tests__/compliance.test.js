import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComplianceSettingsPage from '../app/(dashboard)/settings/compliance/page';
import '@testing-library/jest-dom';

// Setup window.matchMedia mock and MessageChannel polyfill for AntD
beforeAll(() => {
  // Polyfill MessageChannel
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

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
}));

describe('ComplianceSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupFetchMock = (customResponses = {}) => {
    global.fetch = jest.fn((url, options) => {
      const method = options?.method || 'GET';
      
      if (url === '/api/admin/tenant/config') {
        if (method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => customResponses.configGet || {
              status: 'success',
              data: {
                dormancyThresholdDays: 30,
                phaseLegalDelays: {
                  PRE_CONTENTIEUX: 15,
                  MISE_EN_DEMEURE: 30,
                  SAISIE: 45,
                  VENTE: 60
                }
              }
            }
          });
        } else if (method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => customResponses.configPut || { status: 'success', data: {} }
          });
        }
      }
      
      if (url === '/api/admin/tenant/config/thresholds') {
        if (method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: async () => customResponses.thresholdsGet || {
              status: 'success',
              data: {
                aiDeviationModerate: 10.00,
                aiDeviationCritical: 20.00
              }
            }
          });
        } else if (method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => customResponses.thresholdsPut || { status: 'success', data: {} }
          });
        }
      }
      
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });
  };

  test('fetches and displays compliance settings on load', async () => {
    setupFetchMock();

    render(<ComplianceSettingsPage />);

    // Wait for the component to load settings
    await waitFor(() => {
      expect(screen.getByText('Configuration du Tenant')).toBeInTheDocument();
    });

    // Verify fields are populated
    expect(screen.getByLabelText('Seuil de Dormance (jours)')).toHaveValue('30');
    expect(screen.getByLabelText('Pré-contentieux')).toHaveValue('15');
    expect(screen.getByLabelText('Mise en demeure')).toHaveValue('30');
    expect(screen.getByLabelText('Saisie')).toHaveValue('45');
    expect(screen.getByLabelText('Vente')).toHaveValue('60');
    expect(screen.getByLabelText('Déviation Modérée (%)')).toHaveValue('10.00');
    expect(screen.getByLabelText('Déviation Critique (%)')).toHaveValue('20.00');
  });

  test('displays validation error if moderate threshold >= critical threshold', async () => {
    setupFetchMock();

    render(<ComplianceSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Configuration du Tenant')).toBeInTheDocument();
    });

    // Update moderate threshold to 25 (greater than critical 20)
    const moderateInput = screen.getByLabelText('Déviation Modérée (%)');
    fireEvent.change(moderateInput, { target: { value: '25' } });

    // Submit form
    const submitButton = screen.getByText('Enregistrer la conformité');
    fireEvent.click(submitButton);

    // Verify blocker message is displayed
    await waitFor(() => {
      expect(screen.getByText('Bloqueur de conformité')).toBeInTheDocument();
      expect(screen.getByText(/Le seuil de déviation modérée doit être strictement inférieur au seuil de déviation critique/)).toBeInTheDocument();
    });
  });

  test('submits successfully when settings are valid', async () => {
    setupFetchMock();

    render(<ComplianceSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Configuration du Tenant')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Enregistrer la conformité');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check both PUT endpoints were called
      const calls = global.fetch.mock.calls;
      const putCalls = calls.filter(call => call[1]?.method === 'PUT');
      expect(putCalls.length).toBe(2);
      
      const urls = putCalls.map(call => call[0]);
      expect(urls).toContain('/api/admin/tenant/config');
      expect(urls).toContain('/api/admin/tenant/config/thresholds');
    });
  });
});
