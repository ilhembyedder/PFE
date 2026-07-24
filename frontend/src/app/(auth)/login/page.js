'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, Card, Typography, ConfigProvider, theme, Spin, App } from 'antd';
import { MailOutlined, LockOutlined, PartitionOutlined, SafetyOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';

const { Title, Text } = Typography;

function LoginContent() {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('expired') === 'true') {
            message.warning('Votre session a expiré. Veuillez vous reconnecter.');
        }
    }, [searchParams, message]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                    tenantId: isSuperAdmin ? null : values.tenantId,
                }),
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                message.success('Connexion réussie !');
                
                // Redirect based on role
                if (data.data.role === 'SUPER_ADMIN') {
                    router.push('/admin/tenants');
                } else {
                    router.push('/dashboard');
                }
            } else {
                message.error(data.message || 'Identifiants invalides');
            }
        } catch (error) {
            message.error('Une erreur est survenue lors de la connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'radial-gradient(circle at top, #0A192F 0%, #060D1A 100%)',
                padding: '24px',
            }}
        >
            <Card
                style={{
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 16,
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(10, 25, 47, 0.7)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#F8FAFC' }}>
                        LeaseRecover
                    </Title>
                    <Text style={{ color: '#94A3B8' }}>
                        Système intelligent de recouvrement de leasing
                    </Text>
                </div>

                <Form
                    form={form}
                    name="login_form"
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Veuillez saisir votre email' },
                            { type: 'email', message: 'Veuillez saisir un email valide' }
                        ]}
                    >
                        <Input 
                            prefix={<MailOutlined style={{ color: '#64748B' }} />} 
                            placeholder="Adresse email" 
                            size="large"
                            style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Veuillez saisir votre mot de passe' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#64748B' }} />}
                            placeholder="Mot de passe"
                            size="large"
                            style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <SafetyOutlined style={{ color: '#64748B' }} />
                            <Text style={{ color: '#94A3B8', fontSize: 13 }}>Super Admin</Text>
                        </div>
                        <Switch 
                            checked={isSuperAdmin} 
                            onChange={(checked) => {
                                setIsSuperAdmin(checked);
                                if (checked) {
                                    form.setFieldsValue({ tenantId: undefined });
                                }
                            }} 
                        />
                    </div>

                    {!isSuperAdmin && (
                        <Form.Item
                            name="tenantId"
                            rules={[{ required: true, message: 'ID Tenant (UUID) requis pour la connexion' }]}
                        >
                            <Input 
                                prefix={<PartitionOutlined style={{ color: '#64748B' }} />} 
                                placeholder="ID Tenant (UUID)" 
                                size="large"
                                style={{ background: '#0F172A', border: '1px solid #1E293B' }}
                            />
                        </Form.Item>
                    )}

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            size="large" 
                            block 
                            loading={loading}
                            style={{ 
                                height: 44, 
                                fontWeight: 600,
                                background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                                border: 'none',
                                marginTop: 10
                            }}
                        >
                            Se connecter
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#060D1A' }}>
                <Spin size="large" />
            </div>
        }>
            <ConfigProvider
                theme={{
                    algorithm: theme.darkAlgorithm,
                    token: {
                        colorPrimary: '#3B82F6',
                        borderRadius: 8,
                        fontFamily: 'Inter, sans-serif',
                    },
                }}
            >
                <App component={false}>
                    <LoginContent />
                </App>
            </ConfigProvider>
        </React.Suspense>
    );
}
