package com.leasrecover.backend;

import org.junit.jupiter.api.Test;
import java.sql.*;

public class InsertAdminUser {
    @Test
    public void insertAdmin() throws Exception {
        String url = "jdbc:postgresql://localhost:5432/leasrecover";
        String user = "postgres";
        String pass = "postgres";
        
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            // 1. Find tenants
            System.out.println("=== TENANTS ===");
            String tenantId = null;
            String tenantName = null;
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT id, name FROM public.tenant WHERE is_deleted = false")) {
                while (rs.next()) {
                    tenantId = rs.getString("id");
                    tenantName = rs.getString("name");
                    System.out.println("Tenant: " + tenantName + " | id=" + tenantId);
                }
            }
            
            if (tenantId == null) {
                System.out.println("ERROR: No tenant found!");
                return;
            }
            
            // Schema = tenant_<uuid_without_dashes>
            String schemaName = "tenant_" + tenantId.replace("-", "");
            System.out.println("Schema: " + schemaName);
            
            // 2. Check existing users
            System.out.println("\n=== EXISTING USERS in " + schemaName + " ===");
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT id, email, first_name, last_name, role, status FROM " + schemaName + ".app_user WHERE is_deleted = false")) {
                while (rs.next()) {
                    System.out.println("User: " + rs.getString("email") + " | role=" + rs.getString("role") + " | id=" + rs.getString("id"));
                }
            }
            
            // 3. Check if admin with this email already exists
            String adminEmail = "ilhemby1999@gmail.com";
            String passwordHash = "$2a$10$/4KNp4n5RP3fU7iOXOQPiOyFlX0.eA0NIE.Ipzy.abBTb8V7tm2nu";
            
            try (PreparedStatement ps = conn.prepareStatement("SELECT id FROM " + schemaName + ".app_user WHERE email = ? AND is_deleted = false")) {
                ps.setString(1, adminEmail);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        String existingId = rs.getString("id");
                        System.out.println("\nUser already exists with id=" + existingId + ". Updating password and role...");
                        try (PreparedStatement upd = conn.prepareStatement(
                                "UPDATE " + schemaName + ".app_user SET password_hash = ?, role = 'ADMIN', status = 'ACTIVE', updated_at = NOW() WHERE id = ?::uuid")) {
                            upd.setString(1, passwordHash);
                            upd.setString(2, existingId);
                            int updated = upd.executeUpdate();
                            System.out.println("Updated " + updated + " row(s). DONE!");
                        }
                        return;
                    }
                }
            }
            
            // 4. Insert new admin
            String newId = java.util.UUID.randomUUID().toString();
            String insertSql = "INSERT INTO " + schemaName + ".app_user (id, tenant_id, email, password_hash, first_name, last_name, role, status, version, is_deleted, created_at, updated_at) " +
                    "VALUES (?::uuid, ?::uuid, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', 0, false, NOW(), NOW())";
            try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                ps.setString(1, newId);
                ps.setString(2, tenantId);
                ps.setString(3, adminEmail);
                ps.setString(4, passwordHash);
                ps.setString(5, "Ilhem");
                ps.setString(6, "Admin");
                int inserted = ps.executeUpdate();
                System.out.println("\nInserted " + inserted + " admin user: email=" + adminEmail + " id=" + newId);
            }
            
            // 5. Verify
            System.out.println("\n=== VERIFICATION ===");
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT id, email, role, status FROM " + schemaName + ".app_user WHERE email = '" + adminEmail + "' AND is_deleted = false")) {
                while (rs.next()) {
                    System.out.println("VERIFIED: " + rs.getString("email") + " | role=" + rs.getString("role") + " | status=" + rs.getString("status") + " | id=" + rs.getString("id"));
                }
            }
        }
    }
}
