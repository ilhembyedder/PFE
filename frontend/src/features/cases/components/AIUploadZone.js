'use client';

import React, { useState } from 'react';
import { Upload, Progress, Typography, Button, Alert, App, notification as staticNotification } from 'antd';
import { InboxOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const { Text } = Typography;

export default function AIUploadZone({ caseId, phaseKey, onUploadSuccess }) {
    const { notification: appNotification } = App.useApp();
    const notification = (appNotification && typeof appNotification.error === 'function') ? appNotification : staticNotification;
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [status, setStatus] = useState(null); // 'uploading' | 'processing' | 'success' | 'failed'
    const [errorMessage, setErrorMessage] = useState('');

    const handleUpload = async (file) => {
        setUploading(true);
        setStatus('uploading');
        setProgress(0);
        setStatusMessage('Envoi du fichier...');
        setErrorMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('phase', phaseKey);

        // Explicitly tag as EXPERTISE_REPORT to trigger FastAPI extraction in SAISIE phase
        if (phaseKey === 'SAISIE') {
            formData.append('tag', 'EXPERTISE_REPORT');
        }

        try {
            const res = await fetch(`/api/cases/${caseId}/documents`, {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (res.ok && result.status === 'success') {
                notification.success({
                    title: 'Upload réussi',
                    description: 'Fichier ajouté au dossier. Connexion au flux d\'analyse IA...',
                    placement: 'topRight'
                });

                if (phaseKey === 'SAISIE') {
                    connectToProgressStream();
                } else {
                    setStatus('success');
                    setStatusMessage('Fichier ajouté avec succès.');
                    if (onUploadSuccess) onUploadSuccess();
                }
            } else {
                setStatus('failed');
                setStatusMessage('Erreur lors de l\'upload');
                setErrorMessage(result.message || 'Impossible d\'importer le document.');
                notification.error({
                    title: 'Erreur',
                    description: result.message || 'Impossible d\'importer le document.',
                    placement: 'topRight'
                });
            }
        } catch (error) {
            setStatus('failed');
            setStatusMessage('Erreur réseau');
            setErrorMessage('Impossible de joindre le serveur.');
            notification.error({
                title: 'Erreur',
                description: 'Impossible de joindre le serveur.',
                placement: 'topRight'
            });
        }
    };

    const connectToProgressStream = () => {
        setStatus('processing');
        setStatusMessage('Initialisation de la connexion SSE...');
        setProgress(5);

        const eventSource = new EventSource(`/api/cases/${caseId}/progress`);
        let receivedEvent = false;

        // Timeout: if no progress event arrives within 15s, assume the AI pipeline
        // is not active (or already finished) and treat the upload as successful.
        const timeoutId = setTimeout(() => {
            if (!receivedEvent) {
                eventSource.close();
                setStatus('success');
                setProgress(100);
                setStatusMessage('✅ Fichier importé avec succès.');
                if (onUploadSuccess) onUploadSuccess();
            }
        }, 15000);

        eventSource.addEventListener('progress', (event) => {
            try {
                receivedEvent = true;
                clearTimeout(timeoutId);
                const data = JSON.parse(event.data);

                // Handle FAILED status from AI pipeline (AC: #1, FR32)
                if (data.status === 'FAILED') {
                    setStatus('failed');
                    setProgress(0);
                    setErrorMessage(data.message || 'Le document est illisible ou n\'est pas un rapport d\'expertise valide.');
                    setStatusMessage('');
                    eventSource.close();
                    return;
                }

                const currentProgress = data.progress || 0;
                setProgress(currentProgress);

                // Live narration of states based on progress percentage
                if (currentProgress <= 30) {
                    setStatusMessage(`📄 Lecture du document... (${currentProgress}%)`);
                } else if (currentProgress > 30 && currentProgress <= 70) {
                    setStatusMessage(`🔍 Extraction des données... (${currentProgress}%)`);
                } else if (currentProgress > 70 && currentProgress < 100) {
                    setStatusMessage(`📊 Calcul... (${currentProgress}%)`);
                } else if (currentProgress === 100) {
                    setStatusMessage('✅ Analyse et calcul terminés !');
                    setStatus('success');
                    eventSource.close();
                    if (onUploadSuccess) onUploadSuccess();
                }
            } catch (err) {
                console.error('Failed to parse SSE event data', err);
            }
        });

        eventSource.onerror = (err) => {
            // EventSource fires onerror on reconnection attempts (readyState === CONNECTING).
            // Only treat it as fatal if the connection is truly closed.
            if (eventSource.readyState === EventSource.CLOSED) {
                clearTimeout(timeoutId);
                console.error('EventSource connection closed:', err);
                // If we never received any event, the stream was never available —
                // treat as a successful upload since the file was already saved.
                if (!receivedEvent) {
                    setStatus('success');
                    setProgress(100);
                    setStatusMessage('✅ Fichier importé avec succès.');
                    if (onUploadSuccess) onUploadSuccess();
                } else {
                    setStatus('failed');
                    setProgress(0);
                    setErrorMessage('Connexion au flux IA interrompue. Veuillez réessayer.');
                    setStatusMessage('');
                }
            }
        };
    };

    const resetUploadZone = () => {
        setUploading(false);
        setStatus(null);
        setProgress(0);
        setStatusMessage('');
        setErrorMessage('');
    };

    return (
        <div style={{ margin: '10px 0' }}>
            {!uploading && (
                <Dragger
                    name="file"
                    multiple={false}
                    accept=".pdf"
                    beforeUpload={(file) => {
                        handleUpload(file);
                        return false;
                    }}
                    showUploadList={false}
                    style={{
                        background: '#0A1628',
                        border: '1px dashed #334155',
                        borderRadius: 8,
                        padding: '16px'
                    }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#3B82F6', fontSize: 32 }} />
                    </p>
                    <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0' }}>
                        {"Glissez-déposez le rapport d'expertise (.pdf) ici, ou cliquez pour parcourir"}
                    </p>
                    <p style={{ color: '#64748B', fontSize: 11 }}>Fichiers PDF uniquement — max 10 MB</p>
                </Dragger>
            )}

            {uploading && (
                <div style={{
                    background: '#0A1628',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 8,
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    {/* Error state — show Alert banner and Retry CTA (AC: #1, FR26) */}
                    {status === 'failed' ? (
                        <div>
                            <Alert
                                type="error"
                                showIcon
                                title="Échec du traitement"
                                description={errorMessage || 'Le document est illisible ou n\'est pas un rapport d\'expertise valide.'}
                                style={{ marginBottom: 16, textAlign: 'left' }}
                            />
                            <Button
                                type="primary"
                                danger
                                onClick={resetUploadZone}
                                style={{ marginTop: 8 }}
                            >
                                Réessayer / Transmettre un nouveau document
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 12 }}>
                                {status === 'uploading' && <LoadingOutlined style={{ color: '#3B82F6', fontSize: 24, marginBottom: 8 }} />}
                                {status === 'processing' && <LoadingOutlined style={{ color: '#F59E0B', fontSize: 24, marginBottom: 8 }} />}
                                {status === 'success' && <CheckCircleOutlined style={{ color: '#10B981', fontSize: 28, marginBottom: 8 }} />}
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <Text strong style={{ color: '#F8FAFC', fontSize: 14, display: 'block' }}>
                                    {statusMessage}
                                </Text>
                            </div>

                            <div style={{ maxWidth: 400, margin: '0 auto 16px auto' }}>
                                <Progress
                                    percent={progress}
                                    status={status === 'success' ? 'success' : 'active'}
                                    strokeColor={status === 'processing' ? '#F59E0B' : undefined}
                                />
                            </div>

                            {status === 'success' && (
                                <Button
                                    type="default"
                                    size="small"
                                    onClick={resetUploadZone}
                                    style={{ background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0' }}
                                >
                                    Retour
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
