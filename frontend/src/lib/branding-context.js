'use client';

import React, { createContext, useContext, useState } from 'react';

const TenantBrandingContext = createContext();

export function TenantBrandingProvider({ children, initialBranding }) {
    const [branding, setBranding] = useState(initialBranding || { name: 'LeaseRecover', logoUrl: '' });
    return (
        <TenantBrandingContext.Provider value={{ branding, setBranding }}>
            {children}
        </TenantBrandingContext.Provider>
    );
}

export function useTenantBranding() {
    return useContext(TenantBrandingContext);
}
