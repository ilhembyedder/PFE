'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, Typography, DatePicker, Select, Row, Col, Divider, Alert, App, notification as staticNotification } from 'antd';
import { UserOutlined, FileTextOutlined, CarOutlined, DollarOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function NewCasePage() {
    const { notification: appNotification } = App.useApp();
    const notification = (appNotification && typeof appNotification.error === 'function') ? appNotification : staticNotification;
    const router = useRouter();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [loadingContracts, setLoadingContracts] = useState(false);

    useEffect(() => {
        const loadContracts = async () => {
            setLoadingContracts(true);
            try {
                const res = await fetch('/api/contracts');
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    setContracts(data.data || []);
                }
            } catch (e) {
                console.error('Error fetching contracts for autocomplete:', e);
            } finally {
                setLoadingContracts(false);
            }
        };
        loadContracts();
    }, []);

    const handleContractSelect = (contractId) => {
        const contractList = Array.isArray(contracts) ? contracts : [];
        const contract = contractList.find(c => c.id === contractId);
        if (contract) {
            form.setFieldsValue({
                clientFullName: contract.clientName,
                clientRegistrationNumber: contract.clientRegistrationNumber || '',
                clientContactEmail: contract.clientContactEmail || '',
                clientContactPhone: contract.clientContactPhone || '',
                clientAddress: contract.clientAddress || '',
                
                contractReferenceNumber: contract.referenceNumber,
                contractStatus: contract.status,
                contractStartDate: contract.startDate ? dayjs(contract.startDate) : null,
                contractEndDate: contract.endDate ? dayjs(contract.endDate) : null,
                
                vehicleVin: contract.vehicleVin || '',
                vehicleLicensePlate: contract.vehicleLicensePlate || '',
                vehicleBrand: contract.vehicleBrand || '',
                vehicleModel: contract.vehicleModel || '',
                vehicleYear: contract.vehicleYear || null
            });
        }
    };

    const onFinish = async (values) => {
        setSubmitting(true);
        setSubmitError(null);

        try {
            // Convert financial value to cents
            const initialResidualValueCents = Math.round((values.initialResidualValue || 0) * 100);

            // Format dates to ISO String
            const contractStartDate = values.contractStartDate ? values.contractStartDate.toISOString() : null;
            const contractEndDate = values.contractEndDate ? values.contractEndDate.toISOString() : null;

            const payload = {
                clientFullName: values.clientFullName,
                clientRegistrationNumber: values.clientRegistrationNumber || null,
                clientContactEmail: values.clientContactEmail || null,
                clientContactPhone: values.clientContactPhone || null,
                clientAddress: values.clientAddress || null,

                contractReferenceNumber: values.contractReferenceNumber,
                contractStartDate,
                contractEndDate,
                contractStatus: values.contractStatus,

                vehicleVin: values.vehicleVin,
                vehicleLicensePlate: values.vehicleLicensePlate || null,
                vehicleBrand: values.vehicleBrand,
                vehicleModel: values.vehicleModel,
                vehicleYear: values.vehicleYear,

                initialResidualValueCents,
                currencyCode: values.currencyCode || 'TND'
            };

            const res = await fetch('/api/cases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                notification.success({
                    title: 'Dossier initialisé',
                    description: 'Dossier de recouvrement initialisé avec succès.',
                    placement: 'topRight'
                });
                router.push('/dashboard');
            } else {
                setSubmitError(data.message || 'La création du dossier a échoué.');
            }
        } catch (e) {
            setSubmitError('Erreur réseau lors de la création du dossier.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontWeight: 700 }}>
                    Création d&apos;un Dossier de Recouvrement
                </Title>
                <Paragraph style={{ color: '#94A3B8' }}>
                    Initialisez un nouveau dossier de recouvrement en renseignant les informations du client, du contrat et du véhicule.
                </Paragraph>
            </div>

            {submitError && (
                <Alert
                    title="Erreur de validation"
                    description={submitError}
                    type="error"
                    showIcon
                    closable
                    style={{ marginBottom: 24, borderRadius: 8 }}
                />
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                id="create_case_form"
                initialValues={{ currencyCode: 'TND', contractStatus: 'ACTIVE' }}
            >
                {/* LIAISON CONTRAT DE LEASING EXISTANT (OPTIONNEL) */}
                <Card
                    title={
                        <span style={{ color: '#F8FAFC', fontSize: 16, fontWeight: 600 }}>
                            <FileTextOutlined style={{ marginRight: 8, color: '#3B82F6' }} /> Liaison de Contrat de Leasing Existant (Optionnel)
                        </span>
                    }
                    style={{
                        borderRadius: 12,
                        background: '#060D1A',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Rechercher et sélectionner un contrat existant pour pré-remplir le formulaire</span>}
                        name="selectedContractId"
                    >
                        <Select
                            placeholder="Rechercher par référence contrat ou nom de client..."
                            style={{ background: '#0F172A', color: '#FFF' }}
                            styles={{ popup: { root: { background: '#0F172A' } } }}
                            showSearch
                            allowClear
                            loading={loadingContracts}
                            optionFilterProp="children"
                            onChange={handleContractSelect}
                        >
                            {(Array.isArray(contracts) ? contracts : []).map(c => (
                                <Option key={c.id} value={c.id}>
                                    {c.referenceNumber} - {c.clientName} ({c.vehicleBrand ? `${c.vehicleBrand} ${c.vehicleModel}` : 'Pas de véhicule lié'})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Card>

                {/* 1. SECTION CLIENT */}
                <Card
                    title={
                        <span style={{ color: '#F8FAFC', fontSize: 16, fontWeight: 600 }}>
                            <UserOutlined style={{ marginRight: 8, color: '#3B82F6' }} /> Informations Client
                        </span>
                    }
                    style={{
                        borderRadius: 12,
                        background: '#060D1A',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Nom complet ou Raison sociale</span>}
                                name="clientFullName"
                                rules={[{ required: true, message: 'Le nom du client est obligatoire.' }]}
                            >
                                <Input
                                    placeholder="Ex: Société Alpha"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Numéro d&apos;enregistrement (MF)</span>}
                                name="clientRegistrationNumber"
                                rules={[
                                    { pattern: /^[a-zA-Z0-9]*$/, message: 'Le numéro d\'enregistrement doit être alphanumérique.' }
                                ]}
                            >
                                <Input
                                    placeholder="Ex: 1234567M000"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>E-mail de contact</span>}
                                name="clientContactEmail"
                                rules={[{ type: 'email', message: 'Veuillez entrer une adresse e-mail valide.' }]}
                            >
                                <Input
                                    placeholder="Ex: contact@client.com"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Téléphone de contact</span>}
                                name="clientContactPhone"
                            >
                                <Input
                                    placeholder="Ex: +216 71 000 000"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Adresse</span>}
                        name="clientAddress"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Adresse complète du client..."
                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                        />
                    </Form.Item>
                </Card>

                {/* 2. SECTION CONTRAT */}
                <Card
                    title={
                        <span style={{ color: '#F8FAFC', fontSize: 16, fontWeight: 600 }}>
                            <FileTextOutlined style={{ marginRight: 8, color: '#10B981' }} /> Détails du Contrat
                        </span>
                    }
                    style={{
                        borderRadius: 12,
                        background: '#060D1A',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Référence du contrat</span>}
                                name="contractReferenceNumber"
                                rules={[{ required: true, message: 'La référence du contrat est obligatoire.' }]}
                            >
                                <Input
                                    placeholder="Ex: CRT-2026-99"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Statut initial du contrat</span>}
                                name="contractStatus"
                                rules={[{ required: true, message: 'Le statut est obligatoire.' }]}
                            >
                                <Select
                                    size="large"
                                    styles={{ popup: { root: { background: '#0F172A' } } }}
                                    style={{ background: '#0F172A', borderRadius: 8, color: '#FFF' }}
                                >
                                    <Option value="ACTIVE">Actif</Option>
                                    <Option value="SUSPENDED">Suspendu</Option>
                                    <Option value="TERMINATED">Résilié</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Date de début</span>}
                                name="contractStartDate"
                                rules={[{ required: true, message: 'La date de début est obligatoire.' }]}
                            >
                                <DatePicker
                                    size="large"
                                    style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                    placeholder="Sélectionner une date"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Date de fin</span>}
                                name="contractEndDate"
                                rules={[
                                    { required: true, message: 'La date de fin est obligatoire.' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || !getFieldValue('contractStartDate') || value.isAfter(getFieldValue('contractStartDate'))) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('La date de fin doit être postérieure à la date de début.'));
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker
                                    size="large"
                                    style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                    placeholder="Sélectionner une date"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* 3. SECTION VÉHICULE */}
                <Card
                    title={
                        <span style={{ color: '#F8FAFC', fontSize: 16, fontWeight: 600 }}>
                            <CarOutlined style={{ marginRight: 8, color: '#F59E0B' }} /> Spécifications Véhicule
                        </span>
                    }
                    style={{
                        borderRadius: 12,
                        background: '#060D1A',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Numéro de Châssis (VIN)</span>}
                                name="vehicleVin"
                                rules={[
                                    { required: true, message: 'Le numéro de châssis est obligatoire.' },
                                    { pattern: /^[a-zA-Z0-9]+$/, message: 'Le numéro de châssis doit être alphanumérique.' }
                                ]}
                            >
                                <Input
                                    placeholder="Ex: VF1XXXXXXXXXXXXXX"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Plaque d&apos;immatriculation</span>}
                                name="vehicleLicensePlate"
                                rules={[
                                    { pattern: /^[a-zA-Z0-9]*$/, message: 'La plaque d\'immatriculation doit être alphanumérique.' }
                                ]}
                            >
                                <Input
                                    placeholder="Ex: 244TUN9999"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Marque</span>}
                                name="vehicleBrand"
                                rules={[{ required: true, message: 'La marque est obligatoire.' }]}
                            >
                                <Input
                                    placeholder="Ex: Peugeot"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Modèle</span>}
                                name="vehicleModel"
                                rules={[{ required: true, message: 'Le modèle est obligatoire.' }]}
                            >
                                <Input
                                    placeholder="Ex: 3008"
                                    size="large"
                                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Année</span>}
                                name="vehicleYear"
                                rules={[
                                    { required: true, message: 'L\'année est obligatoire.' }
                                ]}
                            >
                                <InputNumber
                                    placeholder="Ex: 2024"
                                    min={1900}
                                    max={new Date().getFullYear() + 1}
                                    size="large"
                                    style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                {/* 4. SECTION FINANCIÈRE */}
                <Card
                    title={
                        <span style={{ color: '#F8FAFC', fontSize: 16, fontWeight: 600 }}>
                            <DollarOutlined style={{ marginRight: 8, color: '#EC4899' }} /> Configuration Financière
                        </span>
                    }
                    style={{
                        borderRadius: 12,
                        background: '#060D1A',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginBottom: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={16}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Valeur Résiduelle Initiale</span>}
                                name="initialResidualValue"
                                rules={[
                                    { required: true, message: 'La valeur résiduelle initiale est obligatoire.' }
                                ]}
                            >
                                <InputNumber
                                    placeholder="0.00"
                                    precision={2}
                                    min={0}
                                    size="large"
                                    style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Devise</span>}
                                name="currencyCode"
                                rules={[{ required: true, message: 'La devise est obligatoire.' }]}
                            >
                                <Select
                                    size="large"
                                    styles={{ popup: { root: { background: '#0F172A' } } }}
                                    style={{ background: '#0F172A', borderRadius: 8, color: '#FFF' }}
                                >
                                    <Option value="TND">Dinar Tunisien (TND)</Option>
                                    <Option value="EUR">Euro (EUR)</Option>
                                    <Option value="USD">Dollar Américain (USD)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.05)', margin: '24px 0' }} />

                <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<PlusOutlined />}
                        size="large"
                        loading={submitting}
                        style={{
                            background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                            border: 'none',
                            height: 48,
                            borderRadius: 8,
                            fontWeight: 600,
                            width: '100%'
                        }}
                    >
                        Initialiser le dossier
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
