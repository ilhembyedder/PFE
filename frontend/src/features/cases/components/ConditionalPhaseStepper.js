'use client';

import React from 'react';
import { Steps, Tooltip } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const phaseToIndex = {
    'PRE_CONTENTIEUX': 0,
    'MISE_EN_DEMEURE': 1,
    'SAISIE': 2,
    'VENTE': 3,
    'CLOTURE': 4
};

export default function ConditionalPhaseStepper({ currentPhase, prerequisitesStatus }) {
    const currentStep = phaseToIndex[currentPhase] !== undefined ? phaseToIndex[currentPhase] : 0;

    const items = [
        {
            title: 'Pré-contentieux',
            content: 'Phase initiale'
        },
        {
            title: 'Mise en demeure',
            content: 'Notification officielle'
        },
        {
            title: 'Saisie du véhicule',
            content: 'Recouvrement physique'
        },
        {
            title: 'Vente',
            content: 'Vente aux enchères'
        },
        {
            title: 'Clôture',
            content: 'Dossier terminé'
        }
    ];

    if (prerequisitesStatus && prerequisitesStatus.isBlocked && prerequisitesStatus.nextPhase) {
        const blockedIndex = phaseToIndex[prerequisitesStatus.nextPhase];
        if (blockedIndex !== undefined && items[blockedIndex]) {
            const originalTitle = items[blockedIndex].title;
            items[blockedIndex].title = (
                <Tooltip 
                    title={
                        <div>
                            {prerequisitesStatus.missingPrerequisites.map((msg, idx) => (
                                <div key={idx} style={{ fontSize: '12px' }}>{msg}</div>
                            ))}
                        </div>
                    }
                    placement="top"
                >
                    <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
                        <LockOutlined style={{ marginRight: 6, color: '#EF4444' }} />
                        <span style={{ color: '#EF4444' }}>{originalTitle}</span>
                    </span>
                </Tooltip>
            );
        }
    }

    return (
        <Steps
            current={currentStep}
            items={items}
            responsive={true}
            size="small"
            style={{
                marginBottom: 24,
                padding: '20px 24px',
                background: '#060D1A',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
        />
    );
}
