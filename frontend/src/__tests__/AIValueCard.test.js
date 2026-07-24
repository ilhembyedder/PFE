import React from 'react';
import { render, screen } from '@testing-library/react';
import AIValueCard from '../features/cases/components/AIValueCard';
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

describe('AIValueCard Component', () => {
  test('renders skeleton loader when isLoading is true', () => {
    render(<AIValueCard isLoading={true} />);
    expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
  });

  test('renders nothing when data is null and isLoading is false', () => {
    const { container } = render(<AIValueCard data={null} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('formats currencies properly by dividing cents by 100', () => {
    const mockData = {
      marketValueCents: 1840000,
      initialResidualValueCents: 2200000,
      deviationValueCents: -360000,
      deviationPercentage: 16.36,
      reliabilityIndicator: 'MODERATE_RISK',
      currencyCode: 'TND'
    };

    render(<AIValueCard data={mockData} isLoading={false} />);

    const cardText = document.body.textContent;
    // Values formatted (e.g. 18 400,00 TND or similar depending on environment formatting)
    expect(cardText).toMatch(/18\s*400/);
    expect(cardText).toMatch(/22\s*000/);
    expect(cardText).toMatch(/3\s*600/);
    expect(cardText).toMatch(/16\s*[.,]\s*36/);
    expect(cardText).toContain('%');
  });

  test('applies correct label for RELIABLE reliabilityIndicator', () => {
    const mockReliable = {
      marketValueCents: 1000000,
      initialResidualValueCents: 1000000,
      deviationValueCents: 0,
      deviationPercentage: 0,
      reliabilityIndicator: 'RELIABLE',
      currencyCode: 'TND'
    };

    render(<AIValueCard data={mockReliable} isLoading={false} />);
    expect(screen.getByText('Estimation Fiable')).toBeInTheDocument();
  });

  test('applies correct label for MODERATE_RISK reliabilityIndicator', () => {
    const mockModerate = {
      marketValueCents: 1840000,
      initialResidualValueCents: 2200000,
      deviationValueCents: -360000,
      deviationPercentage: 16.36,
      reliabilityIndicator: 'MODERATE_RISK',
      currencyCode: 'TND'
    };

    render(<AIValueCard data={mockModerate} isLoading={false} />);
    expect(screen.getByText('Écart Modéré')).toBeInTheDocument();
  });

  test('applies correct label for CRITICAL_RISK reliabilityIndicator', () => {
    const mockCritical = {
      marketValueCents: 1000000,
      initialResidualValueCents: 2200000,
      deviationValueCents: -1200000,
      deviationPercentage: 54.5,
      reliabilityIndicator: 'CRITICAL_RISK',
      currencyCode: 'TND'
    };

    render(<AIValueCard data={mockCritical} isLoading={false} />);
    expect(screen.getByText('Écart Critique')).toBeInTheDocument();
  });

  test('slide-up animation class is present on mount', () => {
    const mockData = {
      marketValueCents: 1000000,
      initialResidualValueCents: 1000000,
      deviationValueCents: 0,
      deviationPercentage: 0,
      reliabilityIndicator: 'RELIABLE',
      currencyCode: 'TND'
    };

    render(<AIValueCard data={mockData} isLoading={false} />);
    const container = document.querySelector('.ai-value-card');
    expect(container).toBeInTheDocument();
  });
});
