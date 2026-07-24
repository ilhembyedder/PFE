import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewCasePage from '../app/(dashboard)/cases/new/page';
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

describe('NewCasePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form fields successfully', () => {
    render(<NewCasePage />);
    expect(screen.getByText("Création d'un Dossier de Recouvrement")).toBeInTheDocument();
    expect(screen.getByLabelText('Nom complet ou Raison sociale')).toBeInTheDocument();
    expect(screen.getByLabelText('Référence du contrat')).toBeInTheDocument();
    expect(screen.getByLabelText('Numéro de Châssis (VIN)')).toBeInTheDocument();
    expect(screen.getByLabelText('Valeur Résiduelle Initiale')).toBeInTheDocument();
  });

  test('submits successfully when form data is valid', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'success', data: { id: 'some-case-uuid' } })
      })
    );

    render(<NewCasePage />);

    // Fill Client details
    fireEvent.change(screen.getByLabelText('Nom complet ou Raison sociale'), { target: { value: 'Société Alpha' } });
    fireEvent.change(screen.getByLabelText("Numéro d'enregistrement (MF)"), { target: { value: '1234567M000' } });

    // Fill Contract details
    fireEvent.change(screen.getByLabelText('Référence du contrat'), { target: { value: 'CRT-2026-99' } });
    
    // Fill Dates
    const dateInputs = screen.getAllByPlaceholderText('Sélectionner une date');
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-30' } });
    fireEvent.keyDown(dateInputs[0], { key: 'Enter', code: 'Enter' });
    fireEvent.change(dateInputs[1], { target: { value: '2027-06-30' } });
    fireEvent.keyDown(dateInputs[1], { key: 'Enter', code: 'Enter' });

    // Fill Vehicle details
    fireEvent.change(screen.getByLabelText('Numéro de Châssis (VIN)'), { target: { value: 'VF1ABC123' } });
    fireEvent.change(screen.getByLabelText('Marque'), { target: { value: 'Peugeot' } });
    fireEvent.change(screen.getByLabelText('Modèle'), { target: { value: '3008' } });
    
    // Antd InputNumber is tricky with change events since it uses custom wrappers, but we can set value of input
    const yearInput = screen.getByLabelText('Année');
    fireEvent.change(yearInput, { target: { value: '2024' } });

    // Fill Financials
    const valueInput = screen.getByLabelText('Valeur Résiduelle Initiale');
    fireEvent.change(valueInput, { target: { value: '15000.50' } });

    // Submit form
    fireEvent.click(screen.getByText('Initialiser le dossier'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/cases', expect.any(Object));
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
