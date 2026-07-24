'use client';

import React, { useState, useEffect } from 'react';
import { 
    Card, Typography, Row, Col, Button, Select, Timeline, Input, 
    Form, Drawer, InputNumber, Spin, Divider, Empty, Tag,
    Tabs, Upload, Collapse, App, notification as staticNotification
} from 'antd';
import { 
    UserOutlined, FileTextOutlined, CarOutlined, DollarOutlined, 
    EditOutlined, SendOutlined, CalendarOutlined, ClockCircleOutlined,
    UserAddOutlined, ArrowLeftOutlined, CheckCircleOutlined, SwapOutlined,
    CommentOutlined, DownloadOutlined, HistoryOutlined, InboxOutlined, PaperClipOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import ConditionalPhaseStepper from '../../../../features/cases/components/ConditionalPhaseStepper';
import AIUploadZone from '../../../../features/cases/components/AIUploadZone';
import InlineBlocker from '../../../../components/ui/InlineBlocker';
import AIValueCard from '../../../../features/cases/components/AIValueCard';
import VehicleDetailsCard from '../../../../features/cases/components/VehicleDetailsCard';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;
const { Dragger } = Upload;

const PHASES = [
    { key: 'PRE_CONTENTIEUX', label: 'Pré-contentieux' },
    { key: 'MISE_EN_DEMEURE', label: 'Mise en demeure' },
    { key: 'SAISIE', label: 'Saisie du véhicule' },
    { key: 'VENTE', label: 'Vente' },
    { key: 'CLOTURE', label: 'Clôture' }
];

function DocumentsTab({ id, caseData, documents, setDocuments, uploadingPhase, setUploadingPhase, uploadZoneRef }) {
    const { notification: appNotification } = App.useApp();
    const notification = (appNotification && typeof appNotification.error === 'function') ? appNotification : staticNotification;
    const handleUpload = async (file, phaseKey) => {
        setUploadingPhase(phaseKey);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('phase', phaseKey);

            const res = await fetch(`/api/cases/${id}/documents`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (res.ok && result.status === 'success') {
                notification.success({
                    title: 'Fichier ajouté au dossier.',
                    placement: 'topRight'
                });
                // Reload document list
                const docsRes = await fetch(`/api/cases/${id}/documents`);
                const docsResult = await docsRes.json();
                if (docsRes.ok && docsResult.status === 'success') {
                    setDocuments(docsResult.data || []);
                }
            } else {
                notification.error({
                    title: 'Erreur lors de l\'upload',
                    description: result.message || 'Impossible d\'ajouter le fichier.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Erreur lors du téléchargement du fichier.',
                placement: 'topRight'
            });
        } finally {
            setUploadingPhase(null);
        }
        // Return false to prevent antd's default upload behavior
        return false;
    };

    const getDocsForPhase = (phaseKey) =>
        (documents || []).filter(doc => doc.phaseUploadedIn === phaseKey);

    const collapseItems = PHASES.map((phase) => {
        const phaseDocs = getDocsForPhase(phase.key);
        const isCurrentPhase = caseData?.currentPhase === phase.key;

        return {
            key: phase.key,
            label: (
                <span style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 14 }}>
                    {phase.label}
                    {isCurrentPhase && (
                        <Tag color="blue" style={{ marginLeft: 10, fontSize: 11 }}>Phase active</Tag>
                    )}
                    <Tag style={{ marginLeft: 8, fontSize: 11, background: '#1E293B', border: '1px solid #334155', color: '#94A3B8' }}>
                        {phaseDocs.length} doc{phaseDocs.length !== 1 ? 's' : ''}
                    </Tag>
                </span>
            ),
            children: (
                <div>
                    {/* Document list */}
                    {phaseDocs.length > 0 ? (
                        <div style={{ marginBottom: 16 }}>
                            {phaseDocs.map(doc => (
                                <div
                                    key={doc.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        background: '#0A1628',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: 8,
                                        marginBottom: 8
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                        <PaperClipOutlined style={{ color: '#3B82F6', fontSize: 16, flexShrink: 0 }} />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {doc.fileName}
                                            </div>
                                            <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>
                                                Par {doc.uploaderName} &bull; {doc.createdAt ? new Date(doc.createdAt).toLocaleString('fr-FR') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`/api/cases/${id}/documents/${doc.id}/download`}
                                        download={doc.fileName}
                                        style={{ flexShrink: 0, marginLeft: 12 }}
                                    >
                                        <Button
                                            type="text"
                                            icon={<DownloadOutlined />}
                                            size="small"
                                            style={{ color: '#3B82F6' }}
                                        >
                                            Télécharger
                                        </Button>
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 16 }}>
                            <Empty description={<span style={{ color: '#64748B', fontSize: 12 }}>Aucun document pour cette phase.</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        </div>
                    )}

                    {/* Upload zone — only shown under the current active phase */}
                    {isCurrentPhase && (
                        <div ref={uploadZoneRef}>
                            {phase.key === 'SAISIE' ? (
                                <AIUploadZone
                                    caseId={id}
                                    phaseKey={phase.key}
                                    onUploadSuccess={async () => {
                                        // Reload document list
                                        const docsRes = await fetch(`/api/cases/${id}/documents`);
                                        const docsResult = await docsRes.json();
                                        if (docsRes.ok && docsResult.status === 'success') {
                                            setDocuments(docsResult.data || []);
                                        }
                                    }}
                                />
                            ) : (
                                <Dragger
                                    name="file"
                                    multiple={false}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    beforeUpload={(file) => {
                                        handleUpload(file, phase.key);
                                        return false;
                                    }}
                                    showUploadList={false}
                                    disabled={uploadingPhase === phase.key}
                                    style={{
                                        background: '#0A1628',
                                        border: '1px dashed #334155',
                                        borderRadius: 8,
                                        padding: '8px'
                                    }}
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined style={{ color: '#3B82F6', fontSize: 28 }} />
                                    </p>
                                    <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0' }}>
                                        {uploadingPhase === phase.key ? 'Envoi en cours...' : 'Glissez-déposez un fichier ici, ou cliquez pour parcourir'}
                                    </p>
                                    <p style={{ color: '#64748B', fontSize: 11 }}>PDF, JPEG ou PNG — max 10 MB</p>
                                </Dragger>
                            )}
                        </div>
                    )}
                </div>
            )
        };
    });

    return (
        <div style={{ marginTop: 16 }}>
            <Collapse
                defaultActiveKey={caseData?.currentPhase ? [caseData.currentPhase] : []}
                items={collapseItems}
                style={{ background: 'transparent', border: 'none' }}
                expandIconPlacement="end"
            />
        </div>
    );
}

function CaseDetailsInner({ params }) {
    const { notification: appNotification } = App.useApp();
    const notification = (appNotification && typeof appNotification.error === 'function') ? appNotification : staticNotification;
    const router = useRouter();
    const searchParams = useSearchParams();

    const [id, setId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState(null);
    
    // Notes and Assignees state
    const [notes, setNotes] = useState([]);
    const [assignees, setAssignees] = useState([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [postingNote, setPostingNote] = useState(false);
    const [assigningUser, setAssigningUser] = useState(false);
    const [historyEvents, setHistoryEvents] = useState([]);
    const [exporting, setExporting] = useState(false);
    const [advancingPhase, setAdvancingPhase] = useState(false);
    const [prerequisitesStatus, setPrerequisitesStatus] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [uploadingPhase, setUploadingPhase] = useState(null);
    const [valuationData, setValuationData] = useState(null);
    const [valuationLoading, setValuationLoading] = useState(false);

    const [activeTabKey, setActiveTabKey] = useState('details');
    const noteInputRef = React.useRef(null);
    const uploadZoneRef = React.useRef(null);
    const stepperRef = React.useRef(null);

    // Set active tab based on query param
    useEffect(() => {
        if (searchParams) {
            const tabParam = searchParams.get('tab');
            if (tabParam === 'notes' || tabParam === 'documents' || tabParam === 'details' || tabParam === 'history') {
                setActiveTabKey(tabParam);
            }
        }
    }, [searchParams]);

    // Handle auto-focus and scrolling
    useEffect(() => {
        if (loading) return;
        
        const focusParam = searchParams?.get('focus');
        if (focusParam === 'noteInput' && activeTabKey === 'notes') {
            setTimeout(() => {
                if (noteInputRef.current) {
                    noteInputRef.current.focus();
                }
            }, 100);
        } else if (focusParam === 'uploadZone' && activeTabKey === 'documents') {
            setTimeout(() => {
                if (uploadZoneRef.current) {
                    uploadZoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        } else if (focusParam === 'stepper') {
            setTimeout(() => {
                if (stepperRef.current) {
                    stepperRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    stepperRef.current.style.outline = '2px solid #3B82F6';
                    stepperRef.current.style.borderRadius = '8px';
                    stepperRef.current.style.transition = 'outline 0.5s ease';
                    setTimeout(() => {
                        if (stepperRef.current) {
                            stepperRef.current.style.outline = 'none';
                        }
                    }, 3000);
                }
            }, 100);
        }
    }, [activeTabKey, loading, searchParams]);

    // Edit Drawer state
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [updatingCase, setUpdatingCase] = useState(false);
    const [editForm] = Form.useForm();

    // Resolve params (supports Next.js 15+ async params)
    useEffect(() => {
        if (params) {
            Promise.resolve(params).then(resolved => {
                setId(resolved.id);
            });
        }
    }, [params]);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // 1. Fetch case details
            const caseRes = await fetch(`/api/cases/${id}`);
            const caseResult = await caseRes.json();
            if (caseRes.ok && caseResult.status === 'success') {
                setCaseData(caseResult.data);

                // Fetch valuation if SAISIE or later (SSE effect handles live updates during SAISIE)
                const isSaisieOrLater = ['SAISIE', 'VENTE', 'CLOTURE'].includes(caseResult.data.currentPhase);
                if (isSaisieOrLater) {
                    setValuationLoading(true);
                    try {
                        await fetchValuation();
                    } finally {
                        setValuationLoading(false);
                    }
                } else {
                    setValuationData(null);
                }
            } else {
                notification.error({
                    title: 'Erreur',
                    description: caseResult.message || 'Impossible de charger les détails du dossier.',
                    placement: 'topRight'
                });
            }

            // 2. Fetch notes
            const notesRes = await fetch(`/api/cases/${id}/notes`);
            const notesResult = await notesRes.json();
            if (notesRes.ok && notesResult.status === 'success') {
                setNotes(notesResult.data);
            }

            // 3. Fetch case history
            const historyRes = await fetch(`/api/cases/${id}/history`);
            const historyResult = await historyRes.json();
            if (historyRes.ok && historyResult.status === 'success') {
                setHistoryEvents(historyResult.data);
            }

            // 4. Fetch assignees
            const assigneesRes = await fetch('/api/cases/assignees');
            const assigneesResult = await assigneesRes.json();
            if (assigneesRes.ok && assigneesResult.status === 'success') {
                setAssignees(assigneesResult.data);
            }

            // 5. Fetch prerequisites status
            try {
                const prereqRes = await fetch(`/api/cases/${id}/prerequisites`);
                const prereqResult = await prereqRes.json();
                if (prereqRes.ok && prereqResult.status === 'success') {
                    setPrerequisitesStatus(prereqResult.data);
                }
            } catch (prereqErr) {
                console.error('Failed to fetch prerequisites:', prereqErr);
            }

            // 6. Fetch documents
            try {
                const docsRes = await fetch(`/api/cases/${id}/documents`);
                const docsResult = await docsRes.json();
                if (docsRes.ok && docsResult.status === 'success') {
                    setDocuments(docsResult.data || []);
                }
            } catch (docErr) {
                console.error('Failed to fetch documents:', docErr);
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Erreur lors du chargement des données.',
                placement: 'topRight'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchValuation = async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/cases/${id}/valuation`);
            const result = await res.json();
            if (res.ok && result.status === 'success') {
                setValuationData(result.data);
            } else if (res.status === 404) {
                // No successful valuation exists yet — pipeline may not have run. This is expected.
                setValuationData(null);
            } else {
                // Unexpected server error — log it so the developer can debug
                console.error('Unexpected error fetching valuation:', result.message || res.status);
                setValuationData(null);
            }
        } catch (e) {
            console.error('Failed to fetch valuation:', e);
            setValuationData(null);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    useEffect(() => {
        if (!loading && caseData) {
            editForm.setFieldsValue({
                clientFullName: caseData.client?.fullNameOrCompany,
                contractReferenceNumber: caseData.contract?.referenceNumber,
                initialResidualValue: (caseData.initialResidualValueCents || 0) / 100,
                currencyCode: caseData.currencyCode || 'TND'
            });
        }
    }, [loading, caseData, editForm]);

    useEffect(() => {
        let eventSource = null;
        const isSaisie = caseData?.currentPhase === 'SAISIE';

        if (id && isSaisie) {
            if (typeof window !== 'undefined' && window.EventSource) {
                eventSource = new EventSource(`/api/cases/${id}/progress`);

                eventSource.addEventListener('progress', async (event) => {
                    try {
                        const progressPayload = JSON.parse(event.data);
                        if (progressPayload.status === 'SUCCESS') {
                            setValuationLoading(true);
                            try {
                                const valRes = await fetch(`/api/cases/${id}/valuation`);
                                const valResult = await valRes.json();
                                if (valRes.ok && valResult.status === 'success') {
                                    setValuationData(valResult.data);
                                }
                            } finally {
                                setValuationLoading(false);
                            }
                        } else if (progressPayload.status === 'FAILED') {
                            setValuationLoading(false);
                        } else {
                            setValuationLoading(true);
                        }
                    } catch (err) {
                        console.error('Failed to parse progress SSE event:', err);
                        setValuationLoading(false);
                    }
                });

                eventSource.onerror = (err) => {
                    console.error('SSE progress stream error:', err);
                    eventSource.close();
                };
            }
        } else if (id && caseData && ['VENTE', 'CLOTURE'].includes(caseData.currentPhase)) {
            fetchValuation();
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [id, caseData?.currentPhase]);

    const handlePostNote = async () => {
        if (!newNoteContent.trim() || !id) return;
        setPostingNote(true);
        try {
            const res = await fetch(`/api/cases/${id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newNoteContent })
            });
            const result = await res.json();
            if (res.ok && result.status === 'success') {
                notification.success({
                    title: 'Note ajoutée',
                    description: 'Votre commentaire a été enregistré avec succès.',
                    placement: 'topRight'
                });
                setNewNoteContent('');
                
                // Refresh notes and history from backend
                const notesRes = await fetch(`/api/cases/${id}/notes`);
                const notesResult = await notesRes.json();
                if (notesRes.ok && notesResult.status === 'success') {
                    setNotes(notesResult.data);
                }

                const historyRes = await fetch(`/api/cases/${id}/history`);
                const historyResult = await historyRes.json();
                if (historyRes.ok && historyResult.status === 'success') {
                    setHistoryEvents(historyResult.data);
                }
            } else {
                notification.error({
                    title: 'Erreur',
                    description: result.message || 'Impossible d\'ajouter la note.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur',
                description: 'Une erreur réseau est survenue lors de l\'ajout de la note.',
                placement: 'topRight'
            });
        } finally {
            setPostingNote(false);
        }
    };

    const handleAssign = async (assigneeId) => {
        if (!id) return;
        setAssigningUser(true);
        try {
            const res = await fetch(`/api/cases/${id}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigneeId })
            });
            const result = await res.json();
            if (res.ok && result.status === 'success') {
                notification.success({
                    title: 'Assignation mise à jour',
                    description: 'Le dossier a été réassigné avec succès.',
                    placement: 'topRight'
                });
                setCaseData(result.data);

                // Refresh history
                const historyRes = await fetch(`/api/cases/${id}/history`);
                const historyResult = await historyRes.json();
                if (historyRes.ok && historyResult.status === 'success') {
                    setHistoryEvents(historyResult.data);
                }
            } else {
                notification.error({
                    title: 'Erreur d\'assignation',
                    description: result.message || 'Impossible de réassigner le dossier.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur',
                description: 'Une erreur réseau est survenue lors de la réassignation.',
                placement: 'topRight'
            });
        } finally {
            setAssigningUser(false);
        }
    };

    const handleAdvancePhase = async () => {
        if (!id) return;
        setAdvancingPhase(true);
        try {
            const res = await fetch(`/api/cases/${id}/next-phase`, {
                method: 'POST'
            });
            const result = await res.json();
            if (res.ok && result.status === 'success') {
                notification.success({
                    title: 'Phase du dossier mise à jour avec succès',
                    placement: 'topRight'
                });
                await fetchData();
            } else {
                notification.error({
                    title: 'Erreur',
                    description: result.message || 'Impossible de mettre à jour la phase.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Une erreur réseau est survenue.',
                placement: 'topRight'
            });
        } finally {
            setAdvancingPhase(false);
        }
    };

    const handleUpdateCase = async (values) => {
        if (!id) return;
        setUpdatingCase(true);
        try {
            const initialResidualValueCents = Math.round((values.initialResidualValue || 0) * 100);
            const payload = {
                clientFullName: values.clientFullName,
                contractReferenceNumber: values.contractReferenceNumber,
                initialResidualValueCents,
                currencyCode: values.currencyCode
            };

            const res = await fetch(`/api/cases/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok && result.status === 'success') {
                notification.success({
                    title: 'Dossier mis à jour',
                    description: 'Les détails du dossier ont été modifiés avec succès.',
                    placement: 'topRight'
                });
                setCaseData(result.data);
                setDrawerVisible(false);

                // Refresh history
                const historyRes = await fetch(`/api/cases/${id}/history`);
                const historyResult = await historyRes.json();
                if (historyRes.ok && historyResult.status === 'success') {
                    setHistoryEvents(historyResult.data);
                }
            } else {
                notification.error({
                    title: 'Erreur de mise à jour',
                    description: result.message || 'Impossible de mettre à jour le dossier.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur',
                description: 'Une erreur réseau est survenue lors de la mise à jour.',
                placement: 'topRight'
            });
        } finally {
            setUpdatingCase(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" description="Chargement des détails du dossier..." />
            </div>
        );
    }

    if (!caseData) {
        return (
            <Card style={{ background: '#060D1A', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center', padding: 40 }}>
                <Empty description={<span style={{ color: '#94A3B8' }}>Dossier introuvable ou accès refusé.</span>} />
                <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => router.push('/dashboard')} style={{ marginTop: 16 }}>
                    Retour au Command Center
                </Button>
            </Card>
        );
    }

    const residualValueDecimal = (caseData.initialResidualValueCents || 0) / 100;
    const notesTimelineItems = (Array.isArray(notes) ? notes : []).map((note) => ({
        color: '#3B82F6',
        content: (
            <div style={{ background: '#0F172A', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong style={{ color: '#F8FAFC', fontSize: 13 }}>{note.authorName}</Text>
                    <Text style={{ color: '#64748B', fontSize: 11 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {new Date(note.createdAt).toLocaleString('fr-FR')}
                    </Text>
                </div>
                <Paragraph style={{ color: '#E2E8F0', margin: 0, fontSize: 13, whiteSpace: 'pre-line' }}>{note.content}</Paragraph>
            </div>
        )
    }));

    const historyTimelineItems = (Array.isArray(historyEvents) ? historyEvents : []).map((event) => {
        let icon = null;
        let color = '#94A3B8';
        if (event.eventType === 'CASE_CREATED') {
            icon = <CheckCircleOutlined style={{ fontSize: 14, color: '#10B981' }} />;
            color = '#10B981';
        } else if (event.eventType === 'PHASE_TRANSITION') {
            icon = <SwapOutlined style={{ fontSize: 14, color: '#EF4444' }} />;
            color = '#EF4444';
        } else if (event.eventType === 'ASSIGNMENT_CHANGED') {
            icon = <UserOutlined style={{ fontSize: 14, color: '#F59E0B' }} />;
            color = '#F59E0B';
        } else if (event.eventType === 'DETAILS_MODIFIED') {
            icon = <EditOutlined style={{ fontSize: 14, color: '#06B6D4' }} />;
            color = '#06B6D4';
        } else if (event.eventType === 'NOTE_ADDED') {
            icon = <CommentOutlined style={{ fontSize: 14, color: '#3B82F6' }} />;
            color = '#3B82F6';
        }

        return {
            color: color,
            icon: icon,
            content: (
                <div style={{ background: '#0F172A', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong style={{ color: '#F8FAFC', fontSize: 13 }}>
                            {event.eventType === 'CASE_CREATED' && '🆕 Dossier Créé'}
                            {event.eventType === 'PHASE_TRANSITION' && '🔄 Transition de Phase'}
                            {event.eventType === 'ASSIGNMENT_CHANGED' && '👤 Assignation'}
                            {event.eventType === 'DETAILS_MODIFIED' && '📝 Modification'}
                            {event.eventType === 'NOTE_ADDED' && '💬 Note Ajoutée'}
                        </Text>
                        <Text style={{ color: '#64748B', fontSize: 11 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {new Date(event.timestamp).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    </div>
                    <Paragraph style={{ color: '#E2E8F0', margin: '4px 0 0 0', fontSize: 13 }}>
                        {event.description}
                    </Paragraph>
                    <Text style={{ color: '#64748B', fontSize: 11, display: 'block', marginTop: 6 }}>
                        Par : {event.actor}
                    </Text>
                </div>
            )
        };
    });

    const handleExportPdf = async () => {
        if (!id) return;
        setExporting(true);
        try {
            const res = await fetch(`/api/cases/${id}/export`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dossier-history-${caseData.contract?.referenceNumber || id}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                notification.success({
                    title: 'Export réussi',
                    description: 'Le rapport PDF a été téléchargé.',
                    placement: 'topRight'
                });
            } else {
                notification.error({
                    title: 'Erreur',
                    description: 'Échec de la génération du rapport PDF.',
                    placement: 'topRight'
                });
            }
        } catch (e) {
            notification.error({
                title: 'Erreur Réseau',
                description: 'Erreur lors du téléchargement du fichier PDF.',
                placement: 'topRight'
            });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {/* Top Navigation & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                <div>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.push('/dashboard')} 
                        style={{ color: '#94A3B8', padding: 0, height: 'auto', marginBottom: 8 }}
                    >
                        Retour au Command Center
                    </Button>
                    <Title level={2} style={{ margin: 0, color: '#F8FAFC', fontWeight: 700 }}>
                        Dossier : {caseData.contract?.referenceNumber}
                    </Title>
                    <Text style={{ color: '#64748B' }}>ID : {caseData.id}</Text>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {caseData.currentPhase !== 'CLOTURE' && (
                        <Button 
                            type="primary" 
                            icon={<SwapOutlined />} 
                            onClick={handleAdvancePhase}
                            loading={advancingPhase}
                            disabled={prerequisitesStatus?.isBlocked}
                            style={{ 
                                background: prerequisitesStatus?.isBlocked 
                                    ? '#1E293B' 
                                    : 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)', 
                                border: 'none', 
                                height: 40,
                                color: prerequisitesStatus?.isBlocked ? '#64748B' : '#FFFFFF'
                            }}
                        >
                            Avancer la phase
                        </Button>
                    )}
                    <Button 
                        type="default" 
                        icon={<EditOutlined />} 
                        onClick={() => setDrawerVisible(true)}
                        style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#E2E8F0', height: 40 }}
                    >
                        Modifier le dossier
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        onClick={handleExportPdf}
                        loading={exporting}
                        style={{ background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)', border: 'none', height: 40 }}
                    >
                        Exporter PDF
                    </Button>
                </div>
            </div>

            {/* Inline Blocker */}
            {prerequisitesStatus?.isBlocked && (
                <InlineBlocker 
                    missingPrerequisites={prerequisitesStatus.missingPrerequisites} 
                    caseId={caseData.id} 
                />
            )}

            {/* Phase Stepper */}
            <div ref={stepperRef}>
                <ConditionalPhaseStepper 
                    currentPhase={caseData.currentPhase} 
                    prerequisitesStatus={prerequisitesStatus} 
                />
            </div>

            {/* AI Valuation Card */}
            {['SAISIE', 'VENTE', 'CLOTURE'].includes(caseData.currentPhase) && (
                <AIValueCard data={valuationData} isLoading={valuationLoading} />
            )}

            {/* Case Stats Panel */}
            <Card style={{ 
                background: '#060D1A', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: 12, 
                marginBottom: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <Row gutter={[24, 24]}>
                    <Col xs={12} sm={6}>
                        <Text style={{ color: '#64748B', display: 'block', marginBottom: 4 }}>Statut</Text>
                        <Tag color={caseData.status === 'ACTIVE' ? 'processing' : 'warning'} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4 }}>
                            {caseData.status}
                        </Tag>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Text style={{ color: '#64748B', display: 'block', marginBottom: 4 }}>Phase lifecycle</Text>
                        <Tag color="purple" style={{ fontSize: 13, padding: '2px 10px', borderRadius: 4 }}>
                            {caseData.currentPhase}
                        </Tag>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Text style={{ color: '#64748B', display: 'block', marginBottom: 4 }}>Valeur résiduelle</Text>
                        <Title level={4} style={{ margin: 0, color: '#F8FAFC', fontWeight: 600 }}>
                            {residualValueDecimal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {caseData.currencyCode}
                        </Title>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Text style={{ color: '#64748B', display: 'block', marginBottom: 4 }}>Assignation</Text>
                        <Select
                            placeholder="Sélectionner un gestionnaire"
                            value={caseData.assigneeId}
                            onChange={handleAssign}
                            loading={assigningUser}
                            style={{ width: '100%', maxWidth: 220 }}
                            styles={{ popup: { root: { background: '#0F172A' } } }}
                            suffixIcon={<UserAddOutlined style={{ color: '#3B82F6' }} />}
                        >
                            {assignees.map((user) => (
                                <Option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.email})
                                </Option>
                            ))}
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Tabbed View */}
            <Tabs 
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                style={{ color: '#E2E8F0' }}
                items={[
                    {
                        key: 'details',
                        label: (
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                                <FileTextOutlined style={{ marginRight: 6 }} /> Détails du Dossier
                            </span>
                        ),
                        children: (
                            <Row gutter={[24, 24]}>
                                <Col span={24}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
                                        {/* 1. Client Info */}
                                        <Card 
                                            title={
                                                <span style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 600 }}>
                                                    <UserOutlined style={{ marginRight: 8, color: '#3B82F6' }} /> Détails du Client
                                                </span>
                                            }
                                            style={{ background: '#060D1A', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}
                                        >
                                            <Row gutter={[16, 16]}>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Raison sociale</Text>
                                                    <Text strong style={{ color: '#F8FAFC' }}>{caseData.client?.fullNameOrCompany || '-'}</Text>
                                                </Col>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>{"Numéro d'enregistrement (MF)"}</Text>
                                                    <Text style={{ color: '#E2E8F0' }}>{caseData.client?.registrationNumber || '-'}</Text>
                                                </Col>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>E-mail de contact</Text>
                                                    <Text style={{ color: '#E2E8F0' }}>{caseData.client?.contactEmail || '-'}</Text>
                                                </Col>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Téléphone de contact</Text>
                                                    <Text style={{ color: '#E2E8F0' }}>{caseData.client?.contactPhone || '-'}</Text>
                                                </Col>
                                                <Col span={24}>
                                                    <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.03)' }} />
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Adresse de facturation</Text>
                                                    <Text style={{ color: '#E2E8F0' }}>{caseData.client?.address || '-'}</Text>
                                                </Col>
                                            </Row>
                                        </Card>

                                        {/* 2. Contract Details */}
                                        <Card 
                                            title={
                                                <span style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 600 }}>
                                                    <FileTextOutlined style={{ marginRight: 8, color: '#10B981' }} /> Spécifications du Contrat
                                                </span>
                                            }
                                            style={{ background: '#060D1A', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}
                                        >
                                            <Row gutter={[16, 16]}>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Référence du contrat</Text>
                                                    <Text strong style={{ color: '#F8FAFC' }}>{caseData.contract?.referenceNumber || '-'}</Text>
                                                </Col>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Statut du contrat</Text>
                                                    <Tag color={caseData.contract?.status === 'ACTIVE' ? 'success' : 'error'} style={{ borderRadius: 4 }}>
                                                        {caseData.contract?.status || '-'}
                                                    </Tag>
                                                </Col>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Date de début</Text>
                                                    <Text style={{ color: '#E2E8F0' }}>
                                                        <CalendarOutlined style={{ marginRight: 6 }} />
                                                        {caseData.contract?.startDate ? new Date(caseData.contract.startDate).toLocaleDateString('fr-FR') : '-'}
                                                    </Text>
                                                </Col>
                                                <Col span={12}>
                                                    <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Date de fin</Text>
                                                    <Text style={{ color: '#E2E8F0' }}>
                                                        <CalendarOutlined style={{ marginRight: 6 }} />
                                                        {caseData.contract?.endDate ? new Date(caseData.contract.endDate).toLocaleDateString('fr-FR') : '-'}
                                                    </Text>
                                                </Col>
                                            </Row>
                                        </Card>
                                        {/* 3. Vehicle Specifications */}
                                        <VehicleDetailsCard 
                                            vehicle={caseData.vehicle} 
                                            contractId={caseData.contract?.id} 
                                            onSuccess={fetchData} 
                                        />
                                    </div>
                                </Col>
                            </Row>
                        )
                    },
                    {
                        key: 'notes',
                        label: (
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                                <CommentOutlined style={{ marginRight: 6 }} /> Notes & Commentaires
                            </span>
                        ),
                        children: (
                            <div style={{ marginTop: 16 }}>
                                <Card 
                                    style={{ background: '#060D1A', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}
                                >
                                    {/* Notes input container */}
                                    <div style={{ marginBottom: 24 }}>
                                        <TextArea
                                            ref={noteInputRef}
                                            rows={3}
                                            value={newNoteContent}
                                            onChange={(e) => setNewNoteContent(e.target.value)}
                                            placeholder="Écrire un commentaire sur ce dossier..."
                                            style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF', borderRadius: 8, marginBottom: 12 }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button 
                                                type="primary" 
                                                icon={<SendOutlined />} 
                                                onClick={handlePostNote}
                                                loading={postingNote}
                                                disabled={!newNoteContent.trim()}
                                                style={{ background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)', border: 'none', borderRadius: 6 }}
                                            >
                                                Commenter
                                            </Button>
                                        </div>
                                    </div>

                                    <Divider style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '0 0 20px 0' }} />

                                    {/* Notes Chronological Timeline */}
                                    <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                                        {notes.length > 0 ? (
                                            <Timeline items={notesTimelineItems} style={{ marginTop: 8 }} />
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                                <Empty description={<span style={{ color: '#64748B', fontSize: 13 }}>Aucune note pour le moment.</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        )
                    },
                    {
                        key: 'history',
                        label: (
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                                <HistoryOutlined style={{ marginRight: 6 }} /> Historique
                            </span>
                        ),
                        children: (
                            <div style={{ marginTop: 16 }}>
                                <Card 
                                    style={{ background: '#060D1A', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}
                                >
                                    <div style={{ overflowY: 'auto', maxHeight: 600 }}>
                                        {historyEvents.length > 0 ? (
                                            <Timeline items={historyTimelineItems} style={{ marginTop: 8 }} />
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                                <Empty description={<span style={{ color: '#64748B', fontSize: 13 }}>Aucun événement historique pour le moment.</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        )
                    },
                    {
                        key: 'documents',
                        label: (
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                                <PaperClipOutlined style={{ marginRight: 6 }} /> Documents
                            </span>
                        ),
                        children: (
                            <DocumentsTab
                                id={id}
                                caseData={caseData}
                                documents={documents}
                                setDocuments={setDocuments}
                                uploadingPhase={uploadingPhase}
                                setUploadingPhase={setUploadingPhase}
                                uploadZoneRef={uploadZoneRef}
                            />
                        )
                    }
                ]}
            />

            {/* Edit Drawer Form */}
            <Drawer
                title={<span style={{ color: '#F8FAFC', fontWeight: 600 }}>Modifier les détails du dossier</span>}
                placement="right"
                size={500}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{
                    body: { background: '#060D1A', color: '#E2E8F0' },
                    header: { background: '#060D1A', borderBottom: '1px solid rgba(255,255,255,0.05)' }
                }}
                forceRender
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleUpdateCase}
                    requiredMark={false}
                >
                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Nom complet ou Raison sociale du Client</span>}
                        name="clientFullName"
                        rules={[{ required: true, message: 'Le nom du client est obligatoire.' }]}
                    >
                        <Input style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }} />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Référence du contrat</span>}
                        name="contractReferenceNumber"
                        rules={[{ required: true, message: 'La référence du contrat est obligatoire.' }]}
                    >
                        <Input style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Valeur résiduelle</span>}
                                name="initialResidualValue"
                                rules={[{ required: true, message: 'La valeur résiduelle est obligatoire.' }]}
                            >
                                <InputNumber 
                                    precision={2} 
                                    min={0}
                                    style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF' }} 
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Devise</span>}
                                name="currencyCode"
                                rules={[{ required: true, message: 'La devise est obligatoire.' }]}
                            >
                                <Select
                                    styles={{ popup: { root: { background: '#0F172A' } } }}
                                    style={{ background: '#0F172A', borderRadius: 8, color: '#FFF' }}
                                >
                                    <Option value="TND">TND</Option>
                                    <Option value="EUR">EUR</Option>
                                    <Option value="USD">USD</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                        <Button 
                            onClick={() => setDrawerVisible(false)}
                            style={{ background: 'transparent', border: '1px solid #1E293B', color: '#94A3B8' }}
                        >
                            Annuler
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit"
                            loading={updatingCase}
                            style={{ background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)', border: 'none' }}
                        >
                            Enregistrer les modifications
                        </Button>
                    </div>
                </Form>
            </Drawer>
        </div>
    );
}

export default function CaseDetailsPage({ params }) {
    return (
        <React.Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#060D1A' }}>
                <Spin size="large" />
            </div>
        }>
            <CaseDetailsInner params={params} />
        </React.Suspense>
    );
}
