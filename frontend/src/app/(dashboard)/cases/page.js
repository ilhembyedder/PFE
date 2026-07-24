'use client';

import React, { useState, useEffect } from 'react';
import { 
    Table, Card, Typography, Select, Button, Space, Row, Col, 
    Input, Badge, Tag, Spin, Tooltip, App
} from 'antd';
import { 
    FilterOutlined, ReloadOutlined, PlusOutlined, SearchOutlined, 
    EyeOutlined, InfoCircleOutlined, ExclamationCircleOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import AlertCard from '../../../features/cases/components/AlertCard';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const PHASES = [
    { key: 'PRE_CONTENTIEUX', label: 'Pré-contentieux', color: 'blue' },
    { key: 'MISE_EN_DEMEURE', label: 'Mise en demeure', color: 'purple' },
    { key: 'SAISIE', label: 'Saisie du véhicule', color: 'orange' },
    { key: 'VENTE', label: 'Vente', color: 'magenta' },
    { key: 'CLOTURE', label: 'Clôture', color: 'default' }
];

export default function CasesRegistryPage() {
    const router = useRouter();
    const { notification } = App.useApp();

    // Data table states
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // Sort state
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Filter states
    const [phase, setPhase] = useState(undefined);
    const [status, setStatus] = useState(undefined);
    const [alertLevel, setAlertLevel] = useState(undefined);

    const [priorityAlerts, setPriorityAlerts] = useState([]);

    const fetchPriorityAlerts = async () => {
        try {
            const res = await fetch('/api/dashboard/alerts/priority');
            const result = await res.json();
            if (res.ok && result.status === 'success') {
                setPriorityAlerts(result.data || []);
            }
        } catch (e) {
            console.error('Error fetching priority alerts:', e);
        }
    };

    useEffect(() => {
        fetchPriorityAlerts();
    }, []);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', (currentPage - 1).toString());
            queryParams.append('size', pageSize.toString());
            queryParams.append('sortBy', `${sortField},${sortOrder}`);
            
            if (phase) queryParams.append('phase', phase);
            if (status) queryParams.append('status', status);
            if (alertLevel) queryParams.append('alertLevel', alertLevel);

            const res = await fetch(`/api/cases?${queryParams.toString()}`);
            const result = await res.json();

            if (res.ok && result.status === 'success') {
                setData(result.data.content || []);
                setTotal(result.data.totalElements || 0);
            } else {
                notification.error({
                    title: 'Erreur',
                    description: result.message || 'Impossible de charger le registre des dossiers.',
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
        fetchCases();
    }, [currentPage, pageSize, sortField, sortOrder, phase, status, alertLevel]);

    const handleTableChange = (pagination, filters, sorter) => {
        if (pagination.current !== currentPage) {
            setCurrentPage(pagination.current);
        }
        if (pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize);
            setCurrentPage(1);
        }

        if (sorter && sorter.field) {
            setSortField(sorter.field);
            setSortOrder(sorter.order === 'descend' ? 'desc' : 'asc');
        } else {
            setSortField('createdAt');
            setSortOrder('desc');
        }
    };

    const resetFilters = () => {
        setPhase(undefined);
        setStatus(undefined);
        setAlertLevel(undefined);
        setCurrentPage(1);
    };

    const getPhaseTag = (phaseKey) => {
        const found = PHASES.find(p => p.key === phaseKey);
        return found ? (
            <Tag color={found.color} style={{ fontWeight: 500 }}>
                {found.label}
            </Tag>
        ) : (
            <Tag>{phaseKey}</Tag>
        );
    };

    const getValuationBadge = (indicator) => {
        switch (indicator) {
            case 'RELIABLE':
                return (
                    <Tag color="success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <span style={{ fontSize: 10 }}>✅</span> Fiable
                    </Tag>
                );
            case 'MODERATE_RISK':
                return (
                    <Tag color="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <span style={{ fontSize: 10 }}>⚠️</span> Risque modéré
                    </Tag>
                );
            case 'CRITICAL_RISK':
                return (
                    <Tag color="error" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <span style={{ fontSize: 10 }}>🚨</span> Risque critique
                    </Tag>
                );
            default:
                return (
                    <Tag style={{ background: '#1E293B', border: '1px solid #334155', color: '#94A3B8', fontWeight: 500 }}>
                        En attente
                    </Tag>
                );
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const columns = [
        {
            title: 'Nom Client',
            dataIndex: 'clientName',
            key: 'clientName',
            sorter: true,
            render: (text) => <Text strong style={{ color: '#F8FAFC' }}>{text || '-'}</Text>
        },
        {
            title: 'Référence Contrat',
            dataIndex: 'contractReference',
            key: 'contractReference',
            sorter: true,
            render: (text) => <Text style={{ fontFamily: 'monospace', color: '#94A3B8' }}>{text || '-'}</Text>
        },
        {
            title: 'Phase Actuelle',
            dataIndex: 'currentPhase',
            key: 'currentPhase',
            sorter: true,
            render: (phaseKey) => getPhaseTag(phaseKey)
        },
        {
            title: 'Gestionnaire',
            dataIndex: 'assigneeName',
            key: 'assigneeName',
            sorter: true,
            render: (text) => <Text style={{ color: '#E2E8F0' }}>{text || '-'}</Text>
        },
        {
            title: 'Statut AI',
            dataIndex: 'reliabilityIndicator',
            key: 'reliabilityIndicator',
            render: (indicator) => getValuationBadge(indicator)
        },
        {
            title: 'Dernière Action',
            dataIndex: 'lastActionAt',
            key: 'lastActionAt',
            sorter: true,
            render: (dateStr) => <Text style={{ color: '#94A3B8' }}>{formatDate(dateStr)}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button 
                    type="text" 
                    icon={<EyeOutlined />} 
                    onClick={() => router.push(`/dashboard/cases/${record.id}`)}
                    style={{ color: '#3B82F6', display: 'inline-flex', alignItems: 'center' }}
                >
                    Consulter
                </Button>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {/* Custom style to enforce exactly 48px row height */}
            <style jsx global>{`
                .cases-table .ant-table-tbody > tr > td {
                    height: 48px !important;
                    padding: 4px 16px !important;
                }
                .ant-select-dropdown {
                    background-color: #0F172A !important;
                }
            `}</style>

            {priorityAlerts && priorityAlerts.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                    <div style={{ marginBottom: 12 }}>
                        <Text strong style={{ color: '#E2E8F0', fontSize: '14px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#EF4444' }}>●</span> Alertes Prioritaires Requérant Votre Attention
                        </Text>
                    </div>
                    <div>
                        {priorityAlerts.map(alert => (
                            <AlertCard key={alert.alertId} alert={alert} />
                        ))}
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '24px 0' }} />
                </div>
            )}

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontWeight: 700 }}>
                        Command Center
                    </Title>
                    <Paragraph style={{ color: '#94A3B8', margin: 0 }}>
                        Consultez et filtrez la liste complète de vos dossiers de recouvrement actifs.
                    </Paragraph>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => router.push('/dashboard/cases/new')}
                    style={{ 
                        background: 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)', 
                        border: 'none', 
                        height: 40,
                        fontWeight: 600
                    }}
                >
                    Nouveau dossier
                </Button>
            </div>

            {/* Filters Toolbar Card */}
            <Card 
                style={{ 
                    background: '#060D1A', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: 12,
                    marginBottom: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={6}>
                        <div style={{ marginBottom: 4 }}><Text style={{ color: '#94A3B8', fontSize: 12 }}>Phase</Text></div>
                        <Select
                            placeholder="Toutes les phases"
                            style={{ width: '100%', background: '#0F172A', color: '#FFF' }}
                            value={phase}
                            onChange={(value) => { setPhase(value); setCurrentPage(1); }}
                            allowClear
                        >
                            {PHASES.map(p => (
                                <Option key={p.key} value={p.key}>{p.label}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{ marginBottom: 4 }}><Text style={{ color: '#94A3B8', fontSize: 12 }}>Statut</Text></div>
                        <Select
                            placeholder="Tous les statuts"
                            style={{ width: '100%', background: '#0F172A', color: '#FFF' }}
                            value={status}
                            onChange={(value) => { setStatus(value); setCurrentPage(1); }}
                            allowClear
                        >
                            <Option value="ACTIVE">Actif</Option>
                            <Option value="SUSPENDED">Suspendu</Option>
                            <Option value="TERMINATED">Résilié</Option>
                            <Option value="CLOSED">Clôturé</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{ marginBottom: 4 }}><Text style={{ color: '#94A3B8', fontSize: 12 }}>Alerte AI</Text></div>
                        <Select
                            placeholder="Tous les niveaux d'alerte"
                            style={{ width: '100%', background: '#0F172A', color: '#FFF' }}
                            value={alertLevel}
                            onChange={(value) => { setAlertLevel(value); setCurrentPage(1); }}
                            allowClear
                        >
                            <Option value="RELIABLE">Fiable (Ecart faible)</Option>
                            <Option value="MODERATE_RISK">Risque Modéré</Option>
                            <Option value="CRITICAL_RISK">Risque Critique</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6} style={{ display: 'flex', gap: 12, alignSelf: 'flex-end' }}>
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={() => { fetchCases(); fetchPriorityAlerts(); }}
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', flex: 1 }}
                        >
                            Rafraîchir
                        </Button>
                        {(phase || status || alertLevel) && (
                            <Button 
                                onClick={resetFilters}
                                type="text"
                                style={{ color: '#EF4444' }}
                            >
                                Réinitialiser
                            </Button>
                        )}
                    </Col>
                </Row>
            </Card>

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
                    className="cases-table"
                    dataSource={data}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        locale: { items_per_page: '/ page' }
                    }}
                    style={{ background: '#060D1A' }}
                />
            </Card>
        </div>
    );
}
