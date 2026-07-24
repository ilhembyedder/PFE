'use client';

import React from 'react';
import { Card, Skeleton, Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';

const RELIABILITY_CONFIG = {
  RELIABLE: {
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    label: 'Estimation Fiable',
    icon: <CheckCircleOutlined style={{ color: '#10B981' }} />
  },
  MODERATE_RISK: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    label: 'Écart Modéré',
    icon: <WarningOutlined style={{ color: '#F59E0B' }} />
  },
  CRITICAL_RISK: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    label: 'Écart Critique',
    icon: <CloseCircleOutlined style={{ color: '#EF4444' }} />
  }
};

export default function AIValueCard({ data, isLoading }) {
  if (isLoading) {
    return (
      <Card
        style={{
          background: '#060D1A',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          marginBottom: 24,
          padding: '12px 16px'
        }}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  if (!data) return null;

  const {
    marketValueCents = 0,
    initialResidualValueCents = 0,
    deviationValueCents = 0,
    deviationPercentage = 0,
    reliabilityIndicator = 'RELIABLE',
    currencyCode = 'TND'
  } = data;

  const config = RELIABILITY_CONFIG[reliabilityIndicator] || RELIABILITY_CONFIG.RELIABLE;

  const formatCurrency = (cents) => {
    const value = cents / 100;
    try {
      return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: currencyCode || 'TND',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch (e) {
      // Fallback
      return `${(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ')} ${currencyCode}`;
    }
  };

  const getSignedPercentage = () => {
    const numPercent = Math.abs(Number(deviationPercentage));
    const formatted = new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numPercent);

    if (deviationValueCents < 0) {
      return `-${formatted}%`;
    } else if (deviationValueCents > 0) {
      return `+${formatted}%`;
    } else {
      return `${formatted}%`;
    }
  };

  return (
    <div className="ai-value-card">
      <Card
        style={{
          background: 'rgba(6, 13, 26, 0.65)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${config.border}`,
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Estimation Financière IA
          </span>
          <Tag 
            icon={config.icon} 
            style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
              color: config.color,
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              margin: 0
            }}
          >
            {config.label}
          </Tag>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Market Value Panel */}
          <div style={{ padding: '4px 0' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', marginBottom: 6 }}>
              Valeur de Marché (Estimée)
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              {formatCurrency(marketValueCents)}
            </div>
          </div>

          {/* Initial Residual Value Panel */}
          <div style={{ padding: '4px 0', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: 24 }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', marginBottom: 6 }}>
              Valeur Résiduelle Initiale
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '-0.02em' }}>
              {formatCurrency(initialResidualValueCents)}
            </div>
          </div>

          {/* Difference Panel */}
          <div style={{ padding: '4px 0', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: 24 }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', marginBottom: 6 }}>
              Écart (Différence)
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: config.color, letterSpacing: '-0.02em', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>{formatCurrency(deviationValueCents)}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85 }}>
                ({getSignedPercentage()})
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
