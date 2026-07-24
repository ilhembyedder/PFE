package com.leasrecover.core.tenant;

public class TenantContextHolder {

    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();
    private static final ThreadLocal<java.util.UUID> currentTenantUuid = new ThreadLocal<>();

    public static void setTenantId(String tenantId) {
        currentTenant.set(tenantId);
    }

    public static String getTenantId() {
        return currentTenant.get();
    }

    public static void setTenantUuid(java.util.UUID tenantUuid) {
        currentTenantUuid.set(tenantUuid);
    }

    public static java.util.UUID getTenantUuid() {
        return currentTenantUuid.get();
    }

    public static void clear() {
        currentTenant.remove();
        currentTenantUuid.remove();
    }
}
