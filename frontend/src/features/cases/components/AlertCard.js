'use client';

import React from 'react';
import { Button, Tag, Typography } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Text, Title } = Typography;

export default function AlertCard({ alert }) {
    const router = useRouter();

    if (!alert) return null;

    const {
        alertId,
        caseId,
        clientName,
        contractReference,
        alertType,
        criticality,
        message
    } = alert;

    const isCritical = criticality === 'CRITICAL';
    const borderColor = isCritical ? '#EF4444' : '#F59E0B';
    const bgGradient = isCritical
        ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(6, 13, 26, 0.65) 100%)'
        : 'linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, rgba(6, 13, 26, 0.65) 100%)';

    const handleAction = () => {
        if (caseId) {
            let targetUrl = `/cases/${caseId}`;
            if (alertType === 'DORMANCY') {
                targetUrl = `/cases/${caseId}?tab=notes&focus=noteInput`;
            } else if (alertType === 'DEADLINE') {
                targetUrl = `/cases/${caseId}?tab=details&focus=stepper`;
            } else if (alertType === 'MISSING_PREREQUISITE') {
                targetUrl = `/cases/${caseId}?tab=documents&focus=uploadZone`;
            }
            router.push(targetUrl);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(6, 13, 26, 0.65)',
                backgroundImage: bgGradient,
                backdropFilter: 'blur(8px)',
                borderLeft: `4px solid ${borderColor}`,
                borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '16px 24px',
                marginBottom: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                flexWrap: 'wrap',
                gap: '16px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '280px' }}>
                <div
                    style={{
                        background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        flexShrink: 0
                    }}
                >
                    <AlertOutlined style={{ color: borderColor, fontSize: '18px' }} />
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <Text strong style={{ color: '#F8FAFC', fontSize: '15px' }}>
                            {clientName || 'Client Inconnu'}
                        </Text>
                        {contractReference && (
                            <Text style={{ fontFamily: 'monospace', color: '#94A3B8', fontSize: '13px' }}>
                                ({contractReference})
                            </Text>
                        )}
                        <Tag
                            color={isCritical ? 'red-solid' : 'orange-solid'}
                            style={{
                                textTransform: 'uppercase',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                lineHeight: '16px',
                                border: 'none',
                                margin: 0
                            }}
                        >
                            {alertType}
                        </Tag>
                    </div>
                    <Text style={{ color: '#E2E8F0', fontSize: '14px' }}>
                        {message}
                    </Text>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <Button
                    type="primary"
                    onClick={handleAction}
                    style={{
                        background: isCritical
                            ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                            : 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                        border: 'none',
                        height: '36px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        boxShadow: isCritical
                            ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                            : '0 4px 12px rgba(245, 158, 11, 0.2)'
                    }}
                >
                    {"Résoudre l'alerte"}
                </Button>
            </div>
        </div>
    );
}
