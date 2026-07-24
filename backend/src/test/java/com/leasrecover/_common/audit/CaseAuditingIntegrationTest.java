package com.leasrecover._common.audit;

import com.leasrecover.core.user.UserContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CaseAuditingIntegrationTest {

    @BeforeEach
    void setUp() {
        UserContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    // ─── UserContextHolder Tests ───

    @Test
    void testUserContextHolder_SetAndGet() {
        String email = "gestionnaire@example.com";
        UserContextHolder.setUserEmail(email);
        assertEquals(email, UserContextHolder.getUserEmail());
    }

    @Test
    void testUserContextHolder_ClearRemovesValue() {
        UserContextHolder.setUserEmail("test@example.com");
        UserContextHolder.clear();
        assertNull(UserContextHolder.getUserEmail());
    }

    @Test
    void testUserContextHolder_InitiallyNull() {
        assertNull(UserContextHolder.getUserEmail());
    }

    @Test
    void testUserContextHolder_OverwriteValue() {
        UserContextHolder.setUserEmail("first@example.com");
        UserContextHolder.setUserEmail("second@example.com");
        assertEquals("second@example.com", UserContextHolder.getUserEmail());
    }

    // ─── AuditRevisionListener Tests ───

    @Test
    void testAuditRevisionListener_SetsUserId_WhenUserContextIsSet() {
        String email = "admin@company.com";
        UserContextHolder.setUserEmail(email);

        AuditRevisionEntity revisionEntity = new AuditRevisionEntity();
        AuditRevisionListener listener = new AuditRevisionListener();

        listener.newRevision(revisionEntity);

        assertEquals(email, revisionEntity.getUserId());
    }

    @Test
    void testAuditRevisionListener_SetsNullUserId_WhenUserContextIsEmpty() {
        // UserContextHolder not set — simulates system-level operations
        AuditRevisionEntity revisionEntity = new AuditRevisionEntity();
        AuditRevisionListener listener = new AuditRevisionListener();

        listener.newRevision(revisionEntity);

        assertNull(revisionEntity.getUserId());
    }

    // ─── AuditRevisionEntity Tests ───

    @Test
    void testAuditRevisionEntity_UserIdGetterSetter() {
        AuditRevisionEntity entity = new AuditRevisionEntity();
        assertNull(entity.getUserId());

        entity.setUserId("user@example.com");
        assertEquals("user@example.com", entity.getUserId());
    }

    @Test
    void testAuditRevisionEntity_TimestampGetterSetter() {
        AuditRevisionEntity entity = new AuditRevisionEntity();
        entity.setTimestamp(1234567890L);
        assertEquals(1234567890L, entity.getTimestamp());
    }

    @Test
    void testAuditRevisionEntity_IdGetterSetter() {
        AuditRevisionEntity entity = new AuditRevisionEntity();
        entity.setId(42);
        assertEquals(42, entity.getId());
    }

    // ─── Structural Tamper-Proof Validation (AC #2) ───

    @Test
    void testRecoveryCaseAud_NoRepositoryExists() {
        // Verify that no JPA repository interface exists for the _AUD table.
        // If someone were to create a RecoveryCaseAudRepository, that would violate
        // the tamper-proof requirement (AC #2 / FR40).
        // We verify this by ensuring no such class exists on the classpath.
        assertThrows(ClassNotFoundException.class, () ->
            Class.forName("com.leasrecover.modules.cases.RecoveryCaseAudRepository")
        );
    }

    @Test
    void testRevinfoAud_NoRepositoryExists() {
        // Similarly, no repository should exist for the revinfo table
        assertThrows(ClassNotFoundException.class, () ->
            Class.forName("com.leasrecover._common.audit.RevinfoRepository")
        );
    }

    @Test
    void testRecoveryCaseAud_NoEntityExists() {
        // No @Entity class should map directly to recovery_case_aud
        // Only Envers manages these tables internally
        assertThrows(ClassNotFoundException.class, () ->
            Class.forName("com.leasrecover.modules.cases.RecoveryCaseAud")
        );
    }
}
