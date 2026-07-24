import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertCard from '../features/cases/components/AlertCard';
import '@testing-library/jest-dom';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
}));

describe('AlertCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders critical alert details and correct border color', () => {
    const criticalAlert = {
      alertId: 'alert-1',
      caseId: 'case-1',
      clientName: 'Jean Dupont',
      contractReference: 'CTR-999',
      alertType: 'DEADLINE',
      criticality: 'CRITICAL',
      message: 'Critical warning message'
    };

    const { container } = render(<AlertCard alert={criticalAlert} />);

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('(CTR-999)')).toBeInTheDocument();
    expect(screen.getByText('DEADLINE')).toBeInTheDocument();
    expect(screen.getByText('Critical warning message')).toBeInTheDocument();

    const cardContainer = container.firstChild;
    expect(cardContainer).toHaveStyle('border-left: 4px solid #EF4444');
  });

  test('renders warning alert details and correct border color', () => {
    const warningAlert = {
      alertId: 'alert-2',
      caseId: 'case-2',
      clientName: 'Marie Curie',
      contractReference: 'CTR-888',
      alertType: 'DORMANCY',
      criticality: 'WARNING',
      message: 'Warning alert message'
    };

    const { container } = render(<AlertCard alert={warningAlert} />);

    expect(screen.getByText('Marie Curie')).toBeInTheDocument();
    expect(screen.getByText('(CTR-888)')).toBeInTheDocument();
    expect(screen.getByText('DORMANCY')).toBeInTheDocument();
    expect(screen.getByText('Warning alert message')).toBeInTheDocument();

    const cardContainer = container.firstChild;
    expect(cardContainer).toHaveStyle('border-left: 4px solid #F59E0B');
  });

  test('navigates to case details page with stepper focus when clicking resolve button on DEADLINE alert', () => {
    const alert = {
      alertId: 'alert-3',
      caseId: 'case-3',
      clientName: 'Client Gamma',
      contractReference: 'CTR-777',
      alertType: 'DEADLINE',
      criticality: 'WARNING',
      message: 'Alert message'
    };

    render(<AlertCard alert={alert} />);

    const button = screen.getByRole('button', { name: "Résoudre l'alerte" });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/cases/case-3?tab=details&focus=stepper');
  });

  test('navigates to case details page with noteInput focus when clicking resolve button on DORMANCY alert', () => {
    const alert = {
      alertId: 'alert-4',
      caseId: 'case-4',
      clientName: 'Client Gamma',
      contractReference: 'CTR-777',
      alertType: 'DORMANCY',
      criticality: 'WARNING',
      message: 'Alert message'
    };

    render(<AlertCard alert={alert} />);

    const button = screen.getByRole('button', { name: "Résoudre l'alerte" });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/cases/case-4?tab=notes&focus=noteInput');
  });

  test('navigates to case details page with uploadZone focus when clicking resolve button on MISSING_PREREQUISITE alert', () => {
    const alert = {
      alertId: 'alert-5',
      caseId: 'case-5',
      clientName: 'Client Gamma',
      contractReference: 'CTR-777',
      alertType: 'MISSING_PREREQUISITE',
      criticality: 'WARNING',
      message: 'Alert message'
    };

    render(<AlertCard alert={alert} />);

    const button = screen.getByRole('button', { name: "Résoudre l'alerte" });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/cases/case-5?tab=documents&focus=uploadZone');
  });
});
