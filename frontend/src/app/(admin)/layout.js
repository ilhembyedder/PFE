'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Typography, Avatar, Button, theme, ConfigProvider, Spin, App } from 'antd';
import {
    ShopOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider, Header, Content } = Layout;
const { Text, Title } = Typography;

export default function AdminLayout({ children }) {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#3B82F6',
                    borderRadius: 8,
                },
            }}
        >
            <App component={false}>
                <AdminLayoutInner>{children}</AdminLayoutInner>
            </App>
        </ConfigProvider>
    );
}

function AdminLayoutInner({ children }) {
    const { message } = App.useApp();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const sessionTimerRef = useRef(null);

    // Fetch session details on mount
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/auth/session');
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    if (data.data.role !== 'SUPER_ADMIN') {
                        message.error('Accès interdit. Rôle Super Admin requis.');
                        router.push('/login');
                    } else {
                        setUser(data.data);
                    }
                } else {
                    router.push('/login');
                }
            } catch (e) {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [router, message]);

    // Client-side idle timeout listener
    useEffect(() => {
        const resetTimer = () => {
            if (sessionTimerRef.current) {
                clearTimeout(sessionTimerRef.current);
            }
            
            let timeoutValue = parseInt(process.env.NEXT_PUBLIC_IDLE_TIMEOUT, 10);
            if (isNaN(timeoutValue) || timeoutValue <= 0) {
                timeoutValue = 900000; // 15 mins default
            }
            
            sessionTimerRef.current = setTimeout(() => {
                handleAutoLogout();
            }, timeoutValue);
        };

        const handleAutoLogout = async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                message.warning('Session expirée pour inactivité.');
                router.push('/login?expired=true');
            } catch (e) {
                router.push('/login');
            }
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);

        resetTimer();

        return () => {
            if (sessionTimerRef.current) {
                clearTimeout(sessionTimerRef.current);
            }
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
        };
    }, [router, message]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            message.success('Déconnecté avec succès');
            router.push('/login');
        } catch (e) {
            message.error('Erreur lors de la déconnexion');
        }
    };

    const navigationItems = [
        {
            key: '/admin/tenants',
            icon: <ShopOutlined />,
            label: 'Gestion des Tenants',
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#060D1A' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#0A111F' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={240}
                style={{
                    background: '#060D1A',
                    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'fixed',
                    height: '100vh',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div>
                        {/* Logo Area */}
                        <div style={{ 
                            height: 64, 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '0 24px', 
                            gap: 12,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <div style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 8, 
                                background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontWeight: 'bold',
                                color: '#FFF'
                            }}>
                                LR
                            </div>
                            {!collapsed && (
                                <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#F8FAFC', fontSize: 16 }}>
                                    LeasRecover Admin
                                </Title>
                            )}
                        </div>

                        {/* Sidebar Menu */}
                        <Menu
                            theme="dark"
                            mode="inline"
                            selectedKeys={[pathname]}
                            items={navigationItems.map(item => ({
                                key: item.key,
                                icon: item.icon,
                                label: item.label,
                                style: {
                                    borderLeft: pathname === item.key ? '3px solid #3B82F6' : '3px solid transparent',
                                    borderRadius: 0,
                                    margin: '4px 0',
                                    background: pathname === item.key ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                                }
                            }))}
                            onClick={({ key }) => router.push(key)}
                            style={{ background: 'transparent', border: 'none', marginTop: 16 }}
                        />
                    </div>
                </div>
            </Sider>

            {/* Content Layout */}
            <Layout style={{ 
                marginLeft: collapsed ? 80 : 240, 
                transition: 'margin-left 0.2s', 
                background: 'transparent',
                minHeight: '100vh'
            }}>
                {/* Header */}
                <Header style={{ 
                    height: 64, 
                    padding: '0 24px', 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#060D1A',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 99
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: '16px', width: 40, height: 40, color: '#94A3B8' }}
                        aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
                    />
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1E293B', color: '#EF4444' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                                    <Text strong style={{ color: '#F8FAFC', fontSize: 13, lineHeight: '18px' }}>
                                        {user.name}
                                    </Text>
                                    <Text style={{ color: '#64748B', fontSize: 11, lineHeight: '14px' }}>
                                        Platform Editor
                                    </Text>
                                </div>
                            </div>
                            <div style={{ height: 24, width: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
                            <Button 
                                type="text" 
                                icon={<LogoutOutlined />} 
                                onClick={handleLogout}
                                danger
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    height: 36,
                                    width: 36,
                                    borderRadius: 6
                                }}
                                tabIndex={0}
                                aria-label="Déconnexion"
                            />
                        </div>
                    )}
                </Header>

                <Content style={{ padding: '32px', color: '#E2E8F0', overflow: 'initial' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
