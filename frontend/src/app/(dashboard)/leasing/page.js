'use client';

import React, { useState, useEffect } from 'react';
import { 
    Table, Card, Typography, Button, Space, Row, Col, 
    Input, Tag, Spin, Tabs, Drawer, Form, Select, DatePicker, Popconfirm, App
} from 'antd';
import { 
    PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, 
    UserOutlined, FileTextOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import InlineBlocker from '../../../components/ui/InlineBlocker';
import EntityDocumentVault from '../../../features/cases/components/EntityDocumentVault';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function LeasingRegistryPage() {
    const { notification } = App.useApp();
    const [activeTab, setActiveTab] = useState('clients');
    
    // Clients State
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [clientSearch, setClientSearch] = useState('');
    const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [clientForm] = Form.useForm();
    const [clientErrors, setClientErrors] = useState([]);

    // Contracts State
    const [contracts, setContracts] = useState([]);
    const [contractsLoading, setContractsLoading] = useState(true);
    const [contractSearch, setContractSearch] = useState('');
    const [contractDrawerOpen, setContractDrawerOpen] = useState(false);
    const [editingContract, setEditingContract] = useState(null);
    const [contractForm] = Form.useForm();
    const [contractErrors, setContractErrors] = useState([]);

    const [formSubmitting, setFormSubmitting] = useState(false);

    // Detail Drawers States
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [contractDetailsOpen, setContractDetailsOpen] = useState(false);

    // Fetch Clients
    const fetchClients = async () => {
        setClientsLoading(true);
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setClients(data.data || []);
            } else {
                notification.error({
                    title: 'Erreur',
                    description: data.message || 'Impossible de charger les clients.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            console.error('Error fetching clients:', e);
        } finally {
            setClientsLoading(false);
        }
    };

    // Fetch Contracts
    const fetchContracts = async () => {
        setContractsLoading(true);
        try {
            const res = await fetch('/api/contracts');
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setContracts(data.data || []);
            } else {
                notification.error({
                    title: 'Erreur',
                    description: data.message || 'Impossible de charger les contrats.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            console.error('Error fetching contracts:', e);
        } finally {
            setContractsLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
        fetchContracts();
    }, []);

    // Filter Clients
    const filteredClients = clients.filter(c => {
        const query = clientSearch.toLowerCase();
        return (
            (c.fullNameOrCompany && c.fullNameOrCompany.toLowerCase().includes(query)) ||
            (c.registrationNumber && c.registrationNumber.toLowerCase().includes(query)) ||
            (c.contactEmail && c.contactEmail.toLowerCase().includes(query))
        );
    });

    // Filter Contracts
    const filteredContracts = contracts.filter(c => {
        const query = contractSearch.toLowerCase();
        return (
            (c.referenceNumber && c.referenceNumber.toLowerCase().includes(query)) ||
            (c.clientName && c.clientName.toLowerCase().includes(query))
        );
    });

    // Handle Client Submit
    const handleClientSubmit = async (values) => {
        setFormSubmitting(true);
        setClientErrors([]);
        
        // Client-side validations
        const errors = [];
        if (!values.fullNameOrCompany || !values.fullNameOrCompany.trim()) {
            errors.push('Le nom complet ou la raison sociale est obligatoire.');
        }
        if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) {
            errors.push('L\'adresse e-mail de contact doit être valide.');
        }
        if (values.registrationNumber && !/^[a-zA-Z0-9]+$/.test(values.registrationNumber)) {
            errors.push('Le numéro d\'enregistrement (MF) doit être uniquement alphanumérique.');
        }

        if (errors.length > 0) {
            setClientErrors(errors);
            setFormSubmitting(false);
            return;
        }

        const payload = {
            fullNameOrCompany: values.fullNameOrCompany,
            registrationNumber: values.registrationNumber || null,
            contactEmail: values.contactEmail || null,
            contactPhone: values.contactPhone || null,
            address: values.address || null
        };

        try {
            const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
            const method = editingClient ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                notification.success({
                    title: editingClient ? 'Client mis à jour' : 'Client créé',
                    description: `Le client ${values.fullNameOrCompany} a été enregistré avec succès.`,
                    placement: 'topRight'
                });
                setClientDrawerOpen(false);
                clientForm.resetFields();
                setEditingClient(null);
                fetchClients();
                fetchContracts(); // Reload contracts to reflect updated client names
            } else {
                setClientErrors([data.message || 'Une erreur est survenue lors de l\'enregistrement du client.']);
            }
        } catch (e) {
            setClientErrors(['Erreur réseau lors de la communication avec le serveur.']);
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle Contract Submit
    const handleContractSubmit = async (values) => {
        setFormSubmitting(true);
        setContractErrors([]);

        // Client-side validations
        const errors = [];
        if (!values.clientId) {
            errors.push('Le choix d\'un client est obligatoire.');
        }
        if (!values.referenceNumber || !values.referenceNumber.trim()) {
            errors.push('La référence du contrat est obligatoire.');
        }
        if (!values.status) {
            errors.push('Le statut du contrat est obligatoire.');
        }
        if (values.startDate && values.endDate && dayjs(values.endDate).isBefore(dayjs(values.startDate))) {
            errors.push('La date de fin doit être postérieure à la date de début.');
        }

        if (errors.length > 0) {
            setContractErrors(errors);
            setFormSubmitting(false);
            return;
        }

        const payload = {
            clientId: values.clientId,
            referenceNumber: values.referenceNumber,
            startDate: values.startDate ? values.startDate.toISOString() : null,
            endDate: values.endDate ? values.endDate.toISOString() : null,
            status: values.status
        };

        try {
            const url = editingContract ? `/api/contracts/${editingContract.id}` : '/api/contracts';
            const method = editingContract ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                notification.success({
                    title: editingContract ? 'Contrat mis à jour' : 'Contrat créé',
                    description: `Le contrat ${values.referenceNumber} a été enregistré avec succès.`,
                    placement: 'topRight'
                });
                setContractDrawerOpen(false);
                contractForm.resetFields();
                setEditingContract(null);
                fetchContracts();
            } else {
                setContractErrors([data.message || 'Une erreur est survenue lors de l\'enregistrement du contrat.']);
            }
        } catch (e) {
            setContractErrors(['Erreur réseau lors de la communication avec le serveur.']);
        } finally {
            setFormSubmitting(false);
        }
    };

    // Delete Client (Soft-delete)
    const handleClientDelete = async (id) => {
        try {
            const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                notification.success({
                    title: 'Client supprimé',
                    description: 'Le client a été supprimé (archivé) avec succès.',
                    placement: 'topRight'
                });
                fetchClients();
                fetchContracts(); // Contracts will have their references updated/marked
            } else {
                notification.error({
                    title: 'Erreur',
                    description: data.message || 'Impossible de supprimer le client.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Erreur lors de la suppression du client.',
                placement: 'topRight'
            });
        }
    };

    // Delete Contract (Soft-delete)
    const handleContractDelete = async (id) => {
        try {
            const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                notification.success({
                    title: 'Contrat supprimé',
                    description: 'Le contrat a été archivé avec succès.',
                    placement: 'topRight'
                });
                fetchContracts();
            } else {
                notification.error({
                    title: 'Erreur',
                    description: data.message || 'Impossible de supprimer le contrat.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Erreur lors de la suppression du contrat.',
                placement: 'topRight'
            });
        }
    };

    // Open Edit Client Drawer
    const startClientEdit = (client) => {
        setEditingClient(client);
        setClientErrors([]);
        clientForm.setFieldsValue({
            fullNameOrCompany: client.fullNameOrCompany,
            registrationNumber: client.registrationNumber,
            contactEmail: client.contactEmail,
            contactPhone: client.contactPhone,
            address: client.address
        });
        setClientDrawerOpen(true);
    };

    // Open Edit Contract Drawer
    const startContractEdit = (contract) => {
        setEditingContract(contract);
        setContractErrors([]);
        contractForm.setFieldsValue({
            clientId: contract.clientId,
            referenceNumber: contract.referenceNumber,
            startDate: contract.startDate ? dayjs(contract.startDate) : null,
            endDate: contract.endDate ? dayjs(contract.endDate) : null,
            status: contract.status
        });
        setContractDrawerOpen(true);
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

    // Table Columns definitions
    const clientColumns = [
        {
            title: 'Nom complet / Raison sociale',
            dataIndex: 'fullNameOrCompany',
            key: 'fullNameOrCompany',
            sorter: (a, b) => a.fullNameOrCompany.localeCompare(b.fullNameOrCompany),
            render: (text) => <Text strong style={{ color: '#F8FAFC' }}>{text || '-'}</Text>
        },
        {
            title: 'Numéro d\'enregistrement (MF)',
            dataIndex: 'registrationNumber',
            key: 'registrationNumber',
            render: (text) => <Text style={{ fontFamily: 'monospace', color: '#94A3B8' }}>{text || '-'}</Text>
        },
        {
            title: 'Email',
            dataIndex: 'contactEmail',
            key: 'contactEmail',
            render: (text) => <Text style={{ color: '#CBD5E1' }}>{text || '-'}</Text>
        },
        {
            title: 'Téléphone',
            dataIndex: 'contactPhone',
            key: 'contactPhone',
            render: (text) => <Text style={{ color: '#CBD5E1' }}>{text || '-'}</Text>
        },
        {
            title: 'Adresse',
            dataIndex: 'address',
            key: 'address',
            ellipsis: true,
            render: (text) => <Text style={{ color: '#64748B' }}>{text || '-'}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="text" 
                        icon={<InfoCircleOutlined />} 
                        onClick={() => {
                            setSelectedClient(record);
                            setClientDetailsOpen(true);
                        }}
                        style={{ color: '#F59E0B', padding: 0 }}
                    />
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => startClientEdit(record)}
                        style={{ color: '#3B82F6', padding: 0 }}
                    />
                    <Popconfirm
                        title="Archiver le client"
                        description="Êtes-vous sûr de vouloir archiver ce client ?"
                        onConfirm={() => handleClientDelete(record.id)}
                        okText="Oui"
                        cancelText="Non"
                        okButtonProps={{ danger: true }}
                    >
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            style={{ padding: 0 }}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const contractColumns = [
        {
            title: 'Référence du contrat',
            dataIndex: 'referenceNumber',
            key: 'referenceNumber',
            sorter: (a, b) => a.referenceNumber.localeCompare(b.referenceNumber),
            render: (text) => <Text strong style={{ fontFamily: 'monospace', color: '#10B981' }}>{text || '-'}</Text>
        },
        {
            title: 'Client associé',
            dataIndex: 'clientName',
            key: 'clientName',
            sorter: (a, b) => (a.clientName || '').localeCompare(b.clientName || ''),
            render: (text) => <Text style={{ color: '#F8FAFC' }}>{text || '-'}</Text>
        },
        {
            title: 'Date de début',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (dateStr) => <Text style={{ color: '#94A3B8' }}>{formatDate(dateStr)}</Text>
        },
        {
            title: 'Date de fin',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (dateStr) => <Text style={{ color: '#94A3B8' }}>{formatDate(dateStr)}</Text>
        },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                let label = status;
                if (status === 'ACTIVE') { color = 'success'; label = 'Actif'; }
                else if (status === 'SUSPENDED') { color = 'warning'; label = 'Suspendu'; }
                else if (status === 'TERMINATED') { color = 'error'; label = 'Résilé'; }
                return <Tag color={color} style={{ fontWeight: 500 }}>{label}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="text" 
                        icon={<InfoCircleOutlined />} 
                        onClick={() => {
                            setSelectedContract(record);
                            setContractDetailsOpen(true);
                        }}
                        style={{ color: '#F59E0B', padding: 0 }}
                    />
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => startContractEdit(record)}
                        style={{ color: '#3B82F6', padding: 0 }}
                    />
                    <Popconfirm
                        title="Archiver le contrat"
                        description="Êtes-vous sûr de vouloir archiver ce contrat ?"
                        onConfirm={() => handleContractDelete(record.id)}
                        okText="Oui"
                        cancelText="Non"
                        okButtonProps={{ danger: true }}
                    >
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            style={{ padding: 0 }}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <style jsx global>{`
                .leasing-table .ant-table-tbody > tr > td {
                    height: 48px !important;
                    padding: 4px 16px !important;
                }
                .ant-tabs-nav {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .ant-tabs-tab {
                    color: #94A3B8 !important;
                }
                .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #3B82F6 !important;
                    font-weight: 600 !important;
                }
            `}</style>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontWeight: 700 }}>
                        Clients & Contrats
                    </Title>
                    <Paragraph style={{ color: '#94A3B8', margin: 0 }}>
                        Gérez le référentiel des clients et de leurs contrats de leasing associés.
                    </Paragraph>
                </div>
                <Space>
                    <Button 
                        type="default" 
                        icon={<PlusOutlined />} 
                        onClick={() => {
                            setEditingClient(null);
                            setClientErrors([]);
                            clientForm.resetFields();
                            setClientDrawerOpen(true);
                        }}
                        style={{ 
                            background: '#0F172A', 
                            border: '1px solid rgba(255, 255, 255, 0.1)', 
                            color: '#F8FAFC',
                            height: 40,
                            fontWeight: 600
                        }}
                    >
                        Nouveau Client
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => {
                            setEditingContract(null);
                            setContractErrors([]);
                            contractForm.resetFields();
                            setContractDrawerOpen(true);
                        }}
                        style={{ 
                            background: 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)', 
                            border: 'none', 
                            height: 40,
                            fontWeight: 600
                        }}
                    >
                        Nouveau Contrat
                    </Button>
                </Space>
            </div>

            {/* Tabbed view for Clients & Contracts */}
            <Tabs 
                defaultActiveKey="clients" 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                    {
                        key: 'clients',
                        label: (
                            <span>
                                <UserOutlined style={{ marginRight: 8 }} />
                                Clients
                            </span>
                        ),
                        children: (
                            <>
                                {/* Search Toolbar */}
                                <Card 
                                    style={{ 
                                        background: '#060D1A', 
                                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                                        borderRadius: 12,
                                        marginBottom: 24,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                    }}
                                    styles={{ body: { padding: '16px 24px' } }}
                                >
                                    <Input
                                        placeholder="Rechercher par nom, e-mail, identifiant..."
                                        prefix={<SearchOutlined style={{ color: '#64748B' }} />}
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF', height: 40 }}
                                        allowClear
                                    />
                                </Card>

                                {/* Clients Table Card */}
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
                                        className="leasing-table"
                                        dataSource={filteredClients}
                                        columns={clientColumns}
                                        rowKey="id"
                                        loading={clientsLoading}
                                        pagination={{
                                            defaultPageSize: 10,
                                            showSizeChanger: true,
                                            pageSizeOptions: ['5', '10', '20', '50'],
                                            locale: { items_per_page: '/ page' }
                                        }}
                                        style={{ background: '#060D1A' }}
                                    />
                                </Card>
                            </>
                        )
                    },
                    {
                        key: 'contracts',
                        label: (
                            <span>
                                <FileTextOutlined style={{ marginRight: 8 }} />
                                Contrats de Leasing
                            </span>
                        ),
                        children: (
                            <>
                                {/* Search Toolbar */}
                                <Card 
                                    style={{ 
                                        background: '#060D1A', 
                                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                                        borderRadius: 12,
                                        marginBottom: 24,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                    }}
                                    styles={{ body: { padding: '16px 24px' } }}
                                >
                                    <Input
                                        placeholder="Rechercher par référence contrat ou nom client..."
                                        prefix={<SearchOutlined style={{ color: '#64748B' }} />}
                                        value={contractSearch}
                                        onChange={(e) => setContractSearch(e.target.value)}
                                        style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF', height: 40 }}
                                        allowClear
                                    />
                                </Card>

                                {/* Contracts Table Card */}
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
                                        className="leasing-table"
                                        dataSource={filteredContracts}
                                        columns={contractColumns}
                                        rowKey="id"
                                        loading={contractsLoading}
                                        pagination={{
                                            defaultPageSize: 10,
                                            showSizeChanger: true,
                                            pageSizeOptions: ['5', '10', '20', '50'],
                                            locale: { items_per_page: '/ page' }
                                        }}
                                        style={{ background: '#060D1A' }}
                                    />
                                </Card>
                            </>
                        )
                    }
                ]}
            />

            {/* ================================================================= */}
            {/* CLIENT DRAWER FORM                                                */}
            {/* ================================================================= */}
            <Drawer
                title={<span style={{ color: '#F8FAFC', fontWeight: 600 }}>{editingClient ? 'Modifier le Client' : 'Créer un nouveau Client'}</span>}
                placement="right"
                size={500}
                onClose={() => setClientDrawerOpen(false)}
                open={clientDrawerOpen}
                styles={{
                    body: { background: '#060D1A', color: '#E2E8F0', padding: 24 },
                    header: { background: '#060D1A', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }
                }}
                forceRender
            >
                <InlineBlocker 
                    missingPrerequisites={clientErrors} 
                    title="Erreurs de validation de formulaire" 
                    showButton={false} 
                />

                <Form
                    form={clientForm}
                    layout="vertical"
                    onFinish={handleClientSubmit}
                    requiredMark={false}
                >
                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Nom complet / Raison sociale</span>}
                        name="fullNameOrCompany"
                        rules={[{ required: true, message: 'Le nom est obligatoire.' }]}
                    >
                        <Input 
                            placeholder="Ex: Société Alpha" 
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>{"Numéro d'enregistrement (MF)"}</span>}
                        name="registrationNumber"
                    >
                        <Input 
                            placeholder="Ex: 1234567M000" 
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Email de contact</span>}
                        name="contactEmail"
                    >
                        <Input 
                            placeholder="Ex: contact@client.com" 
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Téléphone</span>}
                        name="contactPhone"
                    >
                        <Input 
                            placeholder="Ex: +216 71 000 000" 
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Adresse</span>}
                        name="address"
                    >
                        <TextArea 
                            rows={4} 
                            placeholder="Adresse physique du client..." 
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={formSubmitting}
                        style={{
                            background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                            border: 'none',
                            height: 40,
                            width: '100%',
                            marginTop: 16,
                            fontWeight: 600
                        }}
                    >
                        {editingClient ? 'Enregistrer les modifications' : 'Créer le client'}
                    </Button>
                </Form>
            </Drawer>

            {/* ================================================================= */}
            {/* CONTRACT DRAWER FORM                                              */}
            {/* ================================================================= */}
            <Drawer
                title={<span style={{ color: '#F8FAFC', fontWeight: 600 }}>{editingContract ? 'Modifier le Contrat' : 'Créer un nouveau Contrat'}</span>}
                placement="right"
                size={500}
                onClose={() => setContractDrawerOpen(false)}
                open={contractDrawerOpen}
                styles={{
                    body: { background: '#060D1A', color: '#E2E8F0', padding: 24 },
                    header: { background: '#060D1A', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }
                }}
                forceRender
            >
                <InlineBlocker 
                    missingPrerequisites={contractErrors} 
                    title="Erreurs de validation de formulaire" 
                    showButton={false} 
                />

                <Form
                    form={contractForm}
                    layout="vertical"
                    onFinish={handleContractSubmit}
                    requiredMark={false}
                    initialValues={{ status: 'ACTIVE' }}
                >
                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Client associé</span>}
                        name="clientId"
                        rules={[{ required: true, message: 'Le choix d\'un client est obligatoire.' }]}
                    >
                        <Select
                            placeholder="Sélectionnez un client"
                            styles={{ popup: { root: { background: '#0F172A' } } }}
                            style={{ background: '#0F172A', borderRadius: 8, color: '#FFF' }}
                            showSearch
                            optionFilterProp="children"
                        >
                            {clients.map(c => (
                                <Option key={c.id} value={c.id}>{c.fullNameOrCompany} ({c.registrationNumber || 'Pas de MF'})</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Référence du contrat</span>}
                        name="referenceNumber"
                        rules={[{ required: true, message: 'La référence est obligatoire.' }]}
                    >
                        <Input 
                            placeholder="Ex: CRT-2026-99" 
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Date de début</span>}
                        name="startDate"
                    >
                        <DatePicker 
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Date de début"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Date de fin</span>}
                        name="endDate"
                    >
                        <DatePicker 
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Date de fin"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Statut du contrat</span>}
                        name="status"
                        rules={[{ required: true, message: 'Le statut est obligatoire.' }]}
                    >
                        <Select
                            styles={{ popup: { root: { background: '#0F172A' } } }}
                            style={{ background: '#0F172A', borderRadius: 8, color: '#FFF' }}
                        >
                            <Option value="ACTIVE">Actif</Option>
                            <Option value="SUSPENDED">Suspendu</Option>
                            <Option value="TERMINATED">Résilié</Option>
                        </Select>
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={formSubmitting}
                        style={{
                            background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                            border: 'none',
                            height: 40,
                            width: '100%',
                            marginTop: 16,
                            fontWeight: 600
                        }}
                    >
                        {editingContract ? 'Enregistrer les modifications' : 'Créer le contrat'}
                    </Button>
                </Form>
            </Drawer>

            {/* ================================================================= */}
            {/* CLIENT DETAILS DRAWER                                            */}
            {/* ================================================================= */}
            <Drawer
                title={<span style={{ color: '#F8FAFC', fontWeight: 600 }}>Détails du Client</span>}
                placement="right"
                size={600}
                onClose={() => {
                    setClientDetailsOpen(false);
                    setSelectedClient(null);
                }}
                open={clientDetailsOpen}
                styles={{
                    body: { background: '#060D1A', color: '#E2E8F0', padding: 24 },
                    header: { background: '#060D1A', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }
                }}
            >
                {selectedClient && (
                    <Tabs 
                        defaultActiveKey="info"
                        items={[
                            {
                                key: 'info',
                                label: 'Informations Générales',
                                children: (
                                    <Card style={{ background: '#0A111F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, marginTop: 12 }}>
                                        <Row gutter={[16, 16]}>
                                            <Col span={24}>
                                                <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Nom / Raison Sociale</Text>
                                                <Text strong style={{ color: '#F8FAFC', fontSize: 15 }}>{selectedClient.fullNameOrCompany || '-'}</Text>
                                            </Col>
                                            <Col span={12}>
                                                <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>{"Numéro d'enregistrement (MF)"}</Text>
                                                <Text style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{selectedClient.registrationNumber || '-'}</Text>
                                            </Col>
                                            <Col span={12}>
                                                <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Téléphone</Text>
                                                <Text style={{ color: '#CBD5E1' }}>{selectedClient.contactPhone || '-'}</Text>
                                            </Col>
                                            <Col span={24}>
                                                <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Email de contact</Text>
                                                <Text style={{ color: '#CBD5E1' }}>{selectedClient.contactEmail || '-'}</Text>
                                            </Col>
                                            <Col span={24}>
                                                <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Adresse</Text>
                                                <Text style={{ color: '#CBD5E1' }}>{selectedClient.address || '-'}</Text>
                                            </Col>
                                        </Row>
                                    </Card>
                                )
                            },
                            {
                                key: 'documents',
                                label: 'Documents',
                                children: (
                                    <div style={{ marginTop: 12 }}>
                                        <EntityDocumentVault entityType="client" entityId={selectedClient.id} />
                                    </div>
                                )
                            }
                        ]}
                    />
                )}
            </Drawer>

            {/* ================================================================= */}
            {/* CONTRACT DETAILS DRAWER                                          */}
            {/* ================================================================= */}
            <Drawer
                title={<span style={{ color: '#F8FAFC', fontWeight: 600 }}>Détails du Contrat</span>}
                placement="right"
                size={650}
                onClose={() => {
                    setContractDetailsOpen(false);
                    setSelectedContract(null);
                }}
                open={contractDetailsOpen}
                styles={{
                    body: { background: '#060D1A', color: '#E2E8F0', padding: 24 },
                    header: { background: '#060D1A', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }
                }}
            >
                {selectedContract && (
                    <Tabs 
                        defaultActiveKey="info"
                        items={[
                            {
                                key: 'info',
                                label: 'Informations du Contrat',
                                children: (
                                    <>
                                        <Card title={<span style={{ color: '#10B981', fontSize: 14 }}>Référence : {selectedContract.referenceNumber}</span>} style={{ background: '#0A111F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, marginTop: 12 }}>
                                            <Row gutter={[16, 16]}>
                                                <Col span={24}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Client associé</Text>
                                                    <Text strong style={{ color: '#F8FAFC' }}>{selectedContract.clientName || '-'}</Text>
                                                </Col>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Date de début</Text>
                                                    <Text style={{ color: '#CBD5E1' }}>{formatDate(selectedContract.startDate)}</Text>
                                                </Col>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Date de fin</Text>
                                                    <Text style={{ color: '#CBD5E1' }}>{formatDate(selectedContract.endDate)}</Text>
                                                </Col>
                                                <Col span={24}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Statut du contrat</Text>
                                                    <Space style={{ marginTop: 4 }}>
                                                        {selectedContract.status === 'ACTIVE' && <Tag color="success">Actif</Tag>}
                                                        {selectedContract.status === 'SUSPENDED' && <Tag color="warning">Suspendu</Tag>}
                                                        {selectedContract.status === 'TERMINATED' && <Tag color="error">Résilié</Tag>}
                                                    </Space>
                                                </Col>
                                            </Row>
                                        </Card>

                                        <Card title={<span style={{ color: '#F59E0B', fontSize: 14 }}>Véhicule physique</span>} style={{ background: '#0A111F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, marginTop: 16 }}>
                                            {selectedContract.vehicleVin ? (
                                                <Row gutter={[16, 16]}>
                                                    <Col span={12}>
                                                        <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Marque & Modèle</Text>
                                                        <Text strong style={{ color: '#F8FAFC' }}>{selectedContract.vehicleBrand} {selectedContract.vehicleModel}</Text>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Année</Text>
                                                        <Text style={{ color: '#CBD5E1' }}>{selectedContract.vehicleYear || '-'}</Text>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Numéro de Châssis (VIN)</Text>
                                                        <Text style={{ color: '#CBD5E1', fontFamily: 'monospace' }}>{selectedContract.vehicleVin || '-'}</Text>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Text style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>{"Plaque d'immatriculation"}</Text>
                                                        <Text strong style={{ color: '#CBD5E1' }}>{selectedContract.vehicleLicensePlate || '-'}</Text>
                                                    </Col>
                                                </Row>
                                            ) : (
                                                <Text style={{ color: '#64748B', fontStyle: 'italic' }}>{"Aucun véhicule physique n'est lié à ce contrat."}</Text>
                                            )}
                                        </Card>
                                    </>
                                )
                            },
                            {
                                key: 'documents-contract',
                                label: 'Documents du Contrat',
                                children: (
                                    <div style={{ marginTop: 12 }}>
                                        <EntityDocumentVault entityType="contract" entityId={selectedContract.id} />
                                    </div>
                                )
                            },
                            ...(selectedContract.vehicleId ? [
                                {
                                    key: 'documents-vehicle',
                                    label: 'Documents du Véhicule',
                                    children: (
                                        <div style={{ marginTop: 12 }}>
                                            <EntityDocumentVault entityType="vehicle" entityId={selectedContract.vehicleId} />
                                        </div>
                                    )
                                }
                            ] : [])
                        ]}
                    />
                )}
            </Drawer>
        </div>
    );
}
