'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Spin, Alert, Divider, Tabs, App } from 'antd';
import { ShopOutlined, LinkOutlined, SaveOutlined } from '@ant-design/icons';
import { useTenantBranding } from '../../../../lib/branding-context';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

export default function TenantSettingsPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const { setBranding } = useTenantBranding();
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/tenant');
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    setSettings({
                        name: data.data.name,
                        logoUrl: data.data.logoUrl
                    });
                } else {
                    message.error(data.message || 'Impossible de charger les paramètres de marque.');
                }
            } catch (e) {
                message.error('Erreur lors de la connexion au serveur.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [message]);

    useEffect(() => {
        if (!loading && settings) {
            form.setFieldsValue(settings);
        }
    }, [loading, settings, form]);

    const onFinish = async (values) => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch('/api/admin/tenant', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: values.name,
                    logoUrl: values.logoUrl
                })
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                message.success('Configuration de marque mise à jour avec succès.');
                // Update global React context for immediate layout synchronization
                setBranding({
                    name: data.data.name,
                    logoUrl: data.data.logoUrl
                });
            } else {
                setSubmitError(data.message || 'La mise à jour a échoué.');
            }
        } catch (e) {
            setSubmitError('Erreur réseau lors de la mise à jour.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontWeight: 700 }}>
                    Configuration du Tenant
                </Title>
                <Paragraph style={{ color: '#94A3B8' }}>
                    Personnalisez le nom et le logo de votre entreprise pour l&apos;interface de travail de vos Gestionnaires.
                </Paragraph>
            </div>

            <Tabs
                activeKey="/dashboard/settings/tenant"
                onChange={(key) => router.push(key)}
                items={[
                    { key: '/dashboard/settings/tenant', label: 'Marque & Logo' },
                    { key: '/dashboard/settings/compliance', label: 'Délais & Conformité' }
                ]}
                style={{ marginBottom: 24 }}
            />

            <Card
                style={{
                    borderRadius: 12,
                    background: '#060D1A',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
            >
                {submitError && (
                    <Alert
                        message="Erreur de validation"
                        description={submitError}
                        type="error"
                        showIcon
                        closable
                        style={{ marginBottom: 20, borderRadius: 8 }}
                    />
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    id="tenant_branding_form"
                >
                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Nom de l&apos;entreprise</span>}
                        name="name"
                        rules={[
                            { required: true, message: 'Le nom de l\'entreprise est obligatoire.' }
                        ]}
                    >
                        <Input
                            prefix={<ShopOutlined style={{ color: '#64748B' }} />}
                            placeholder="Ex: LeaseRecover France"
                            size="large"
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>URL du Logo</span>}
                        name="logoUrl"
                        rules={[
                            { required: true, message: 'L\'URL du logo est obligatoire.' },
                            { type: 'url', message: 'Veuillez entrer une URL de logo valide (http://... ou https://...).' }
                        ]}
                    >
                        <Input
                            prefix={<LinkOutlined style={{ color: '#64748B' }} />}
                            placeholder="Ex: https://example.com/logo.png"
                            size="large"
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.05)', margin: '24px 0' }} />

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            size="large"
                            loading={submitting}
                            style={{
                                background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                                border: 'none',
                                height: 44,
                                borderRadius: 8,
                                fontWeight: 600,
                                width: '100%'
                            }}
                        >
                            Enregistrer les paramètres
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
