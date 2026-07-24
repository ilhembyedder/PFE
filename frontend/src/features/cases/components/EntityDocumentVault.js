'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Button, List, Typography, Space, Spin, App } from 'antd';
import { InboxOutlined, DownloadOutlined, PaperClipOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const { Text, Title } = Typography;

export default function EntityDocumentVault({ entityType, entityId }) {
  const { notification } = App.useApp();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?entityType=${entityType}&entityId=${entityId}`);
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setDocuments(data.data || []);
      } else {
        notification.error({
          title: 'Erreur',
          description: data.message || 'Impossible de charger les documents.',
          placement: 'topRight'
        });
      }
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, notification]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file) => {
    // Client-side validations
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      notification.error({
        title: 'Fichier trop volumineux',
        description: 'Le fichier doit être inférieur à 10 Mo.',
        placement: 'topRight'
      });
      return false;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      notification.error({
        title: 'Format non supporté',
        description: 'Seuls les formats PDF, JPEG et PNG sont acceptés.',
        placement: 'topRight'
      });
      return false;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        notification.success({
          title: 'Document importé',
          description: 'Le document a été ajouté au coffre-fort numérique.',
          placement: 'topRight'
        });
        fetchDocuments();
      } else {
        notification.error({
          title: 'Erreur lors de l\'upload',
          description: data.message || 'Une erreur est survenue lors de l\'envoi du fichier.',
          placement: 'topRight'
        });
      }
    } catch (e) {
      notification.error({
        title: 'Erreur Réseau',
        description: 'Impossible de se connecter au serveur.',
        placement: 'topRight'
      });
    } finally {
      setUploading(false);
    }
    return false;
  };

  const getFormatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD MMM YYYY [à] HH:mm');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Upload Zone */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, padding: 4 }}>
        <Dragger
          name="file"
          multiple={false}
          beforeUpload={handleUpload}
          showUploadList={false}
          disabled={uploading}
          style={{
            background: '#09111F',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '24px'
          }}
        >
          {uploading ? (
            <div style={{ padding: '8px 0' }}>
              <Spin size="medium" style={{ marginBottom: 12 }} />
              <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>Importation en cours...</p>
            </div>
          ) : (
            <>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#3B82F6', fontSize: 36 }} />
              </p>
              <p style={{ color: '#F1F5F9', fontSize: 13, margin: '8px 0 4px 0', fontWeight: 500 }}>
                Glissez-déposez un document administratif ici, ou cliquez pour parcourir
              </p>
              <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>
                Formats acceptés : PDF, JPG, PNG — Max 10 Mo
              </p>
            </>
          )}
        </Dragger>
      </div>

      {/* Document List Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0, color: '#F8FAFC', fontSize: 14 }}>
            Documents consultables ({documents.length})
          </Title>
          {loading && <Spin size="small" />}
        </div>

        {loading && documents.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={documents}
            locale={{ emptyText: <span style={{ color: '#64748B' }}>Aucun document administratif associé</span> }}
            renderItem={(doc) => (
              <List.Item
                style={{
                  background: '#0A1324',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#3B82F6'
                    }}
                  >
                    <FileTextOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ color: '#F8FAFC', fontSize: 13 }}>
                      {doc.fileName}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 11 }}>
                      Ajouté le {getFormatDate(doc.createdAt)} {doc.uploaderName ? `par ${doc.uploaderName}` : ''}
                    </Text>
                  </div>
                </div>
                <Space>
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    download={doc.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      style={{ color: '#3B82F6' }}
                      aria-label="Télécharger le document"
                    />
                  </a>
                </Space>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
