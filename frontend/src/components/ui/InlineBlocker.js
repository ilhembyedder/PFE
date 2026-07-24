'use client';

import React from 'react';
import { Alert, Button, Space } from 'antd';
import { LockOutlined, UploadOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function InlineBlocker({ 
    missingPrerequisites, 
    caseId, 
    title = "Progression de phase bloquée - Prérequis requis manquants", 
    showButton = true 
}) {
    if (!missingPrerequisites || missingPrerequisites.length === 0) return null;

    const message = (
        <span style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '14px' }}>
            {title}
        </span>
    );

    const description = (
        <div style={{ marginTop: 8 }}>
            <ul style={{ paddingLeft: 20, margin: '4px 0 16px 0' }}>
                {missingPrerequisites.map((req, idx) => (
                    <li key={idx} style={{ color: '#CBD5E1', marginBottom: 6, fontSize: '13px' }}>
                        {req}
                    </li>
                ))}
            </ul>
            {showButton && caseId && (
                <Space>
                    <Link href={`/cases/${caseId}`} passHref legacyBehavior>
                        <Button 
                            type="primary" 
                            size="small" 
                            icon={<UploadOutlined />}
                            style={{ 
                                background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)', 
                                borderColor: '#DC2626',
                                fontWeight: 500,
                                borderRadius: 6
                            }}
                        >
                            Accéder aux documents
                        </Button>
                    </Link>
                </Space>
            )}
        </div>
    );

    return (
        <Alert
            title={message}
            description={description}
            type="error"
            showIcon
            icon={<LockOutlined style={{ color: '#EF4444', fontSize: '18px' }} />}
            style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                marginBottom: 24,
                padding: '16px 24px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
            }}
        />
    );
}
