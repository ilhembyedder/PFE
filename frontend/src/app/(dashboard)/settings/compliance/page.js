'use client';

import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Card, Typography, Spin, Alert, Divider, Tabs, App } from 'antd';
import { SaveOutlined, WarningOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function ComplianceSettingsPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [configRes, thresholdsRes] = await Promise.all([
                    fetch('/api/admin/tenant/config'),
                    fetch('/api/admin/tenant/config/thresholds')
                ]);
                const configData = await configRes.json();
                const thresholdsData = await thresholdsRes.json();

                if (configRes.ok && configData.status === 'success' && thresholdsRes.ok && thresholdsData.status === 'success') {
                    setSettings({
                        dormancyThresholdDays: configData.data.dormancyThresholdDays,
                        PRE_CONTENTIEUX: configData.data.phaseLegalDelays?.PRE_CONTENTIEUX,
                        MISE_EN_DEMEURE: configData.data.phaseLegalDelays?.MISE_EN_DEMEURE,
                        SAISIE: configData.data.phaseLegalDelays?.SAISIE,
                        VENTE: configData.data.phaseLegalDelays?.VENTE,
                        aiDeviationModerate: thresholdsData.data.aiDeviationModerate,
                        aiDeviationCritical: thresholdsData.data.aiDeviationCritical
                    });
                } else {
                    message.error('Impossible de charger la configuration de conformité.');
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
        setValidationError(null);
        setSubmitError(null);

        // Client-side validations (FR11, UX-DR6 blocker)
        const errors = [];
        if (!values.dormancyThresholdDays || values.dormancyThresholdDays <= 0) {
            errors.push("Le seuil de dormance doit être un entier positif supérieur à 0.");
        }
        if (!values.PRE_CONTENTIEUX || values.PRE_CONTENTIEUX <= 0) {
            errors.push("Le délai légal pour la phase Pré-contentieux doit être supérieur à 0.");
        }
        if (!values.MISE_EN_DEMEURE || values.MISE_EN_DEMEURE <= 0) {
            errors.push("Le délai légal pour la phase Mise en demeure doit être supérieur à 0.");
        }
        if (!values.SAISIE || values.SAISIE <= 0) {
            errors.push("Le délai légal pour la phase Saisie doit être supérieur à 0.");
        }
        if (!values.VENTE || values.VENTE <= 0) {
            errors.push("Le délai légal pour la phase Vente doit être supérieur à 0.");
        }

        if (values.aiDeviationModerate === undefined || values.aiDeviationModerate === null || values.aiDeviationModerate < 0 || values.aiDeviationModerate > 100) {
            errors.push("Le seuil de déviation modérée doit être compris entre 0% et 100%.");
        }
        if (values.aiDeviationCritical === undefined || values.aiDeviationCritical === null || values.aiDeviationCritical < 0 || values.aiDeviationCritical > 100) {
            errors.push("Le seuil de déviation critique doit être compris entre 0% et 100%.");
        }
        if (values.aiDeviationModerate !== undefined && values.aiDeviationModerate !== null &&
            values.aiDeviationCritical !== undefined && values.aiDeviationCritical !== null &&
            Number(values.aiDeviationModerate) >= Number(values.aiDeviationCritical)) {
            errors.push("Le seuil de déviation modérée doit être strictement inférieur au seuil de déviation critique.");
        }

        if (errors.length > 0) {
            setValidationError(errors.join(' '));
            return;
        }

        setSubmitting(true);
        try {
            const configBody = {
                dormancyThresholdDays: Number(values.dormancyThresholdDays),
                phaseLegalDelays: {
                    PRE_CONTENTIEUX: Number(values.PRE_CONTENTIEUX),
                    MISE_EN_DEMEURE: Number(values.MISE_EN_DEMEURE),
                    SAISIE: Number(values.SAISIE),
                    VENTE: Number(values.VENTE)
                }
            };
            const thresholdsBody = {
                aiDeviationModerate: Number(values.aiDeviationModerate),
                aiDeviationCritical: Number(values.aiDeviationCritical)
            };

            const [configRes, thresholdsRes] = await Promise.all([
                fetch('/api/admin/tenant/config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(configBody)
                }),
                fetch('/api/admin/tenant/config/thresholds', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(thresholdsBody)
                })
            ]);

            const configData = await configRes.json();
            const thresholdsData = await thresholdsRes.json();

            if (configRes.ok && configData.status === 'success' && thresholdsRes.ok && thresholdsData.status === 'success') {
                message.success('Configuration de conformité mise à jour avec succès.');
            } else {
                let errorMsg = '';
                if (!configRes.ok || configData.status !== 'success') {
                    errorMsg += (configData.message || 'La mise à jour de la conformité a échoué.') + ' ';
                }
                if (!thresholdsRes.ok || thresholdsData.status !== 'success') {
                    errorMsg += (thresholdsData.message || 'La mise à jour des seuils d\'écart a échoué.');
                }
                setSubmitError(errorMsg.trim());
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
                    Gérez les règles de conformité légale et le moteur de détection d&apos;alertes.
                </Paragraph>
            </div>

            <Tabs
                activeKey="/dashboard/settings/compliance"
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
                {validationError && (
                    <Alert
                        id="inline_blocker"
                        message="Bloqueur de conformité"
                        description={validationError}
                        type="warning"
                        showIcon
                        icon={<WarningOutlined style={{ color: '#F59E0B' }} />}
                        closable
                        onClose={() => setValidationError(null)}
                        style={{
                            marginBottom: 20,
                            borderRadius: 8,
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#FBBF24'
                        }}
                    />
                )}

                {submitError && (
                    <Alert
                        message="Erreur de sauvegarde"
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
                    id="tenant_compliance_form"
                >
                    <Title level={4} style={{ color: '#F8FAFC', marginTop: 0, marginBottom: 16 }}>
                        Seuil d&apos;Inactivité
                    </Title>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Seuil de Dormance (jours)</span>}
                        name="dormancyThresholdDays"
                        tooltip="Nombre de jours maximum d'inactivité avant de lever un drapeau d'alerte."
                        rules={[{ required: true, message: 'Le seuil de dormance est obligatoire.' }]}
                    >
                        <InputNumber
                            min={1}
                            size="large"
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Ex: 30"
                        />
                    </Form.Item>

                    <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.05)', margin: '24px 0' }} />

                    <Title level={4} style={{ color: '#F8FAFC', marginBottom: 16 }}>
                        Délais Légaux des Phases (jours)
                    </Title>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Pré-contentieux</span>}
                        name="PRE_CONTENTIEUX"
                        rules={[{ required: true, message: 'Le délai de la phase Pré-contentieux est obligatoire.' }]}
                    >
                        <InputNumber
                            min={1}
                            size="large"
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Ex: 15"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Mise en demeure</span>}
                        name="MISE_EN_DEMEURE"
                        rules={[{ required: true, message: 'Le délai de la phase Mise en demeure est obligatoire.' }]}
                    >
                        <InputNumber
                            min={1}
                            size="large"
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Ex: 30"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Saisie</span>}
                        name="SAISIE"
                        rules={[{ required: true, message: 'Le délai de la phase Saisie est obligatoire.' }]}
                    >
                        <InputNumber
                            min={1}
                            size="large"
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Ex: 45"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Vente</span>}
                        name="VENTE"
                        rules={[{ required: true, message: 'Le délai de la phase Vente est obligatoire.' }]}
                    >
                        <InputNumber
                            min={1}
                            size="large"
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Ex: 60"
                        />
                    </Form.Item>

                    <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.05)', margin: '24px 0' }} />

                    <Title level={4} style={{ color: '#F8FAFC', marginBottom: 16 }}>
                        Seuils de Déviation de l&apos;Évaluation IA (%)
                    </Title>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Déviation Modérée (%)</span>}
                        name="aiDeviationModerate"
                        tooltip="Seuil de déviation à partir duquel l'évaluation est considérée comme modérée (ex: 10.00)."
                        rules={[{ required: true, message: 'Le seuil de déviation modérée est obligatoire.' }]}
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            step={0.01}
                            size="large"
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Ex: 10.00"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Déviation Critique (%)</span>}
                        name="aiDeviationCritical"
                        tooltip="Seuil de déviation à partir duquel l'évaluation est considérée comme critique (ex: 20.00)."
                        rules={[{ required: true, message: 'Le seuil de déviation critique est obligatoire.' }]}
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            step={0.01}
                            size="large"
                            style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }}
                            placeholder="Ex: 20.00"
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
                            Enregistrer la conformité
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
