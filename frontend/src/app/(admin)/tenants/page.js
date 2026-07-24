'use client';

import React, { useState, useEffect } from 'react';
import { 
    Table, Card, Typography, Button, Space, Input, Tag, 
    App, Spin, Modal, Form, InputNumber, Popconfirm
} from 'antd';
import { 
    PlusOutlined, ReloadOutlined, ShopOutlined, LinkOutlined, 
    MailOutlined, LockOutlined, CalendarOutlined, SafetyOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function TenantsManagementPage() {
    const { notification } = App.useApp();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/super-admin/tenants');
            const result = await res.json();

            if (res.ok && result.status === 'success') {
                setData(result.data || []);
            } else {
                notification.error({
                    title: 'Erreur',
                    description: result.message || 'Impossible de charger la liste des tenants.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Une erreur est survenue lors de la connexion au serveur.',
                placement: 'topRight'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleDeactivate = async (id) => {
        try {
            const res = await fetch(`/api/super-admin/tenants/${id}/deactivate`, {
                method: 'PUT'
            });
            const result = await res.json();
            
            if (res.ok && result.status === 'success') {
                notification.success({
                    title: 'Succès',
                    description: 'Le tenant a été désactivé avec succès.',
                    placement: 'topRight'
                });
                fetchTenants();
            } else {
                notification.error({
                    title: 'Erreur',
                    description: result.message || 'La désactivation a échoué.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Une erreur est survenue lors de la connexion au serveur.',
                placement: 'topRight'
            });
        }
    };

    const handleCreateTenant = async (values) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/super-admin/tenants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: values.name,
                    logoUrl: values.logoUrl,
                    dataRetentionMonths: values.dataRetentionMonths,
                    adminEmail: values.adminEmail,
                    adminPassword: values.adminPassword
                })
            });
            const result = await res.json();

            if (res.ok && result.status === 'success') {
                notification.success({
                    title: 'Tenant créé',
                    description: `Le tenant "${values.name}" a été provisionné et son schéma de base de données configuré.`,
                    placement: 'topRight'
                });
                setModalVisible(false);
                form.resetFields();
                fetchTenants();
            } else {
                notification.error({
                    title: 'Erreur de création',
                    description: result.message || 'Impossible de créer le tenant.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Une erreur est survenue lors de la création du tenant.',
                placement: 'topRight'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    const columns = [
        {
            title: 'Logo',
            dataIndex: 'logoUrl',
            key: 'logoUrl',
            width: 70,
            render: (url, record) => url ? (
                <img 
                    src={url} 
                    alt="Logo" 
                    style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} 
                />
            ) : (
                <div style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 8, 
                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    color: '#94A3B8',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    {record.name ? record.name.substring(0, 2).toUpperCase() : 'TN'}
                </div>
            )
        },
        {
            title: 'Nom du Tenant',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong style={{ color: '#F8FAFC' }}>{text}</Text>
        },
        {
            title: 'ID / UUID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <Text style={{ fontFamily: 'monospace', color: '#94A3B8', fontSize: 12 }}>{id}</Text>
        },
        {
            title: 'Rétention des données',
            dataIndex: 'dataRetentionMonths',
            key: 'dataRetentionMonths',
            render: (months) => <Text style={{ color: '#E2E8F0' }}>{months} mois</Text>
        },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (status) => status === 'ACTIVE' ? (
                <Tag color="success" style={{ fontWeight: 500 }}>Actif</Tag>
            ) : (
                <Tag color="error" style={{ fontWeight: 500 }}>Inactif</Tag>
            )
        },
        {
            title: 'Date de Création',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (dateStr) => <Text style={{ color: '#94A3B8' }}>{formatDate(dateStr)}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            render: (_, record) => record.status === 'ACTIVE' ? (
                <Popconfirm
                    title="Désactiver le tenant"
                    description={`Êtes-vous sûr de vouloir suspendre le tenant "${record.name}" ? Tous les accès gestionnaires seront immédiatement bloqués.`}
                    onConfirm={() => handleDeactivate(record.id)}
                    okText="Désactiver"
                    cancelText="Annuler"
                    okButtonProps={{ danger: true }}
                >
                    <Button 
                        type="text" 
                        danger
                        style={{ padding: 0 }}
                    >
                        Désactiver
                    </Button>
                </Popconfirm>
            ) : (
                <Text style={{ color: '#64748B', fontStyle: 'italic' }}>Aucune action</Text>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <style jsx global>{`
                .tenants-table .ant-table-tbody > tr > td {
                    height: 52px !important;
                    padding: 8px 16px !important;
                }
            `}</style>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                <div>
                    <Title level={2} style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontWeight: 700 }}>
                        Gestion des Tenants (Sociétés)
                    </Title>
                    <Paragraph style={{ color: '#94A3B8', margin: 0 }}>
                        Onboardez et configurez les environnements isolés pour vos sociétés de leasing clientes.
                    </Paragraph>
                </div>
                <Space>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchTenants}
                        style={{ background: '#060D1A', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#E2E8F0', height: 40 }}
                    >
                        Actualiser
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setModalVisible(true)}
                        style={{ 
                            background: 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)', 
                            border: 'none', 
                            height: 40,
                            fontWeight: 600
                        }}
                    >
                        Nouveau Tenant
                    </Button>
                </Space>
            </div>

            {/* Registry Table Card */}
            <Card 
                style={{ 
                    background: '#060D1A', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    overflow: 'hidden'
                }}
                styles={{ body: { padding: 0 } }}
            >
                <Table 
                    className="tenants-table"
                    dataSource={data}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        defaultPageSize: 10
                    }}
                    style={{ background: '#060D1A' }}
                />
            </Card>

            {/* Creation Modal */}
            <Modal
                title={
                    <div style={{ color: '#F8FAFC', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
                        Provisionner un nouveau Tenant
                    </div>
                }
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={550}
                styles={{
                    mask: { backdropFilter: 'blur(4px)' },
                    content: {
                        background: '#060D1A',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                    }
                }}
                forceRender
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateTenant}
                    requiredMark={false}
                    initialValues={{ dataRetentionMonths: 60 }}
                >
                    <Paragraph style={{ color: '#94A3B8', fontSize: 13, marginBottom: 20 }}>
                        La création d&apos;un tenant génère automatiquement son schéma PostgreSQL isolé et migre la structure globale via Flyway. Un utilisateur Administrateur initial sera également configuré dans ce schéma.
                    </Paragraph>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Nom de la Société</span>}
                        name="name"
                        rules={[{ required: true, message: 'Le nom de la société est requis' }]}
                    >
                        <Input 
                            prefix={<ShopOutlined style={{ color: '#64748B' }} />}
                            placeholder="Ex: Carthage Leasing"
                            size="large"
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>URL du Logo</span>}
                        name="logoUrl"
                        rules={[
                            { required: true, message: 'L\'URL du logo est requise' },
                            { type: 'url', message: 'Veuillez entrer une URL valide' }
                        ]}
                    >
                        <Input 
                            prefix={<LinkOutlined style={{ color: '#64748B' }} />}
                            placeholder="Ex: https://carthage-leasing.tn/logo.png"
                            size="large"
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Durée de rétention des données (en mois)</span>}
                        name="dataRetentionMonths"
                        rules={[{ required: true, message: 'La durée de rétention est requise' }]}
                    >
                        <InputNumber 
                            min={1} 
                            max={120} 
                            size="large"
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '24px 0' }} />
                    <Title level={5} style={{ color: '#F8FAFC', margin: '0 0 16px 0', fontSize: 14 }}>
                        <SafetyOutlined style={{ color: '#EF4444', marginRight: 8 }} />
                        Compte Administrateur Initial
                    </Title>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Adresse Email Admin</span>}
                        name="adminEmail"
                        rules={[
                            { required: true, message: 'L\'email admin est requis' },
                            { type: 'email', message: 'Veuillez saisir un email valide' }
                        ]}
                    >
                        <Input 
                            prefix={<MailOutlined style={{ color: '#64748B' }} />}
                            placeholder="Ex: admin@carthage-leasing.tn"
                            size="large"
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Mot de passe Admin</span>}
                        name="adminPassword"
                        rules={[
                            { required: true, message: 'Le mot de passe admin est requis' },
                            { min: 8, message: 'Le mot de passe doit faire au moins 8 caractères' }
                        ]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined style={{ color: '#64748B' }} />}
                            placeholder="Mot de passe"
                            size="large"
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 28 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button 
                                onClick={() => {
                                    setModalVisible(false);
                                    form.resetFields();
                                }}
                                style={{ background: '#1E293B', border: 'none', color: '#94A3B8' }}
                            >
                                Annuler
                            </Button>
                            <Button 
                                type="primary" 
                                htmlType="submit"
                                loading={submitting}
                                style={{ 
                                    background: 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)', 
                                    border: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Provisionner le schéma
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
