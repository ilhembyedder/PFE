'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Modal, Form, Input, InputNumber, Empty, App } from 'antd';
import { CarOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function VehicleDetailsCard({ vehicle, contractId, onSuccess }) {
  const { notification } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      if (vehicle) {
        form.setFieldsValue({
          vin: vehicle.vin,
          licensePlate: vehicle.licensePlate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year
        });
      } else {
        form.resetFields();
      }
    }
  }, [vehicle, form, modalOpen]);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (values) => {
    if (!contractId) {
      notification.error({
        title: 'Erreur',
        description: 'ID de contrat manquant. Impossible de lier le véhicule.',
        placement: 'topRight'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      const result = await res.json();
      
      if (res.ok && result.status === 'success') {
        notification.success({
          title: vehicle ? 'Véhicule mis à jour' : 'Véhicule enregistré',
          description: vehicle 
            ? 'Les informations du véhicule ont été modifiées avec succès.'
            : 'Le véhicule physique a été lié au contrat avec succès.',
          placement: 'topRight'
        });
        handleCloseModal();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        notification.error({
          title: 'Erreur',
          description: result.message || 'Impossible d\'enregistrer le véhicule.',
          placement: 'topRight'
        });
      }
    } catch (e) {
      notification.error({
        title: 'Erreur Réseau',
        description: 'Une erreur réseau est survenue. Veuillez réessayer.',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasVehicle = vehicle && vehicle.vin;

  return (
    <>
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <CarOutlined style={{ marginRight: 8, color: '#F59E0B', fontSize: 18 }} />
              Fiche Technique Véhicule
            </span>
            {hasVehicle && (
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={handleOpenModal}
                style={{ color: '#60A5FA', padding: '0 4px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Modifier
              </Button>
            )}
          </div>
        }
        style={{ 
          background: 'rgba(6, 13, 26, 0.65)', 
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)', 
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        {hasVehicle ? (
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Marque & Modèle</Text>
              <Text strong style={{ color: '#F8FAFC', fontSize: 14 }}>{vehicle.brand} {vehicle.model}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Année de mise en circulation</Text>
              <Text style={{ color: '#E2E8F0', fontSize: 14 }}>{vehicle.year || '-'}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>Numéro de Châssis (VIN)</Text>
              <Text style={{ color: '#E2E8F0', fontFamily: 'monospace', fontSize: 14 }}>{vehicle.vin || '-'}</Text>
            </Col>
            <Col span={12}>
              <Text style={{ color: '#64748B', display: 'block', fontSize: 12 }}>{"Plaque d'immatriculation"}</Text>
              <Text strong style={{ color: '#E2E8F0', fontSize: 14 }}>{vehicle.licensePlate || '-'}</Text>
            </Col>
          </Row>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '24px 16px',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: 8
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ color: '#E2E8F0', display: 'block', fontSize: 14, marginBottom: 4 }}>
                    Aucun Véhicule Enregistré
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 12, maxWidth: 360, display: 'inline-block' }}>
                    {"Ce contrat n'a pas encore de véhicule physique associé. Veuillez l'enregistrer pour activer le suivi."}
                  </Text>
                </div>
              }
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleOpenModal}
                style={{ 
                  background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)', 
                  border: 'none',
                  borderRadius: 6,
                  height: 38,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                }}
              >
                Lier le Véhicule
              </Button>
            </Empty>
          </div>
        )}
      </Card>

      <Modal
        title={
          <span style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 16 }}>
            {vehicle ? 'Modifier les spécifications du véhicule' : 'Lier un véhicule physique au contrat'}
          </span>
        }
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        styles={{
          body: { background: '#060D1A', padding: '24px' },
          header: { background: '#060D1A', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }
        }}
        width={500}
        forceRender
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          initialValues={vehicle ? {
            vin: vehicle.vin,
            licensePlate: vehicle.licensePlate,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year
          } : {}}
        >
          <Form.Item
            label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Numéro de Châssis (VIN)</span>}
            name="vin"
            rules={[
              { required: true, message: 'Le VIN est obligatoire.' },
              { pattern: /^[a-zA-Z0-9]+$/, message: 'Le VIN doit être uniquement composé de chiffres et lettres.' },
              { max: 50, message: 'Le VIN ne doit pas dépasser 50 caractères.' }
            ]}
          >
            <Input 
              placeholder="Ex: 1HGBH928238128312" 
              style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF', height: 38 }} 
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>{"Plaque d'immatriculation"}</span>}
            name="licensePlate"
            rules={[
              { required: true, message: 'La plaque d\'immatriculation est obligatoire.' },
              { max: 50, message: 'La plaque ne doit pas dépasser 50 caractères.' }
            ]}
          >
            <Input 
              placeholder="Ex: 123 TUN 4567" 
              style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF', height: 38 }} 
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Marque</span>}
                name="brand"
                rules={[
                  { required: true, message: 'La marque est obligatoire.' },
                  { max: 100, message: 'La marque ne doit pas dépasser 100 caractères.' }
                ]}
              >
                <Input 
                  placeholder="Ex: Peugeot" 
                  style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF', height: 38 }} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Modèle</span>}
                name="model"
                rules={[
                  { required: true, message: 'Le modèle est obligatoire.' },
                  { max: 100, message: 'Le modèle ne doit pas dépasser 100 caractères.' }
                ]}
              >
                <Input 
                  placeholder="Ex: 3008" 
                  style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#FFF', height: 38 }} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={{ color: '#E2E8F0', fontWeight: 500 }}>Année de mise en circulation</span>}
            name="year"
            rules={[
              { required: true, message: 'L\'année est obligatoire.' },
              { type: 'number', min: 1900, message: 'L\'année doit être supérieure ou égale à 1900.' }
            ]}
          >
            <InputNumber 
              placeholder="Ex: 2020" 
              style={{ width: '100%', background: '#0F172A', border: '1px solid #1E293B', color: '#FFF', height: 38 }} 
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <Button 
              onClick={handleCloseModal}
              style={{ background: 'transparent', border: '1px solid #1E293B', color: '#94A3B8', height: 38 }}
            >
              Annuler
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              style={{ 
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)', 
                border: 'none', 
                height: 38,
                fontWeight: 600
              }}
            >
              Enregistrer
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
