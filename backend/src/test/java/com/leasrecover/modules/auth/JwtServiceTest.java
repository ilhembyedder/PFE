package com.leasrecover.modules.auth;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "replace_me_with_a_secure_base64_encoded_256bit_key_test_string_longer");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 3600000L); // 1 hour
    }

    @Test
    void testGenerateAndParseToken() {
        String userId = UUID.randomUUID().toString();
        String email = "user@example.com";
        String tenantId = UUID.randomUUID().toString();
        String role = "GESTIONNAIRE";
        String name = "Sonia G";

        String token = jwtService.generateToken(userId, email, tenantId, role, name);
        assertNotNull(token);

        assertTrue(jwtService.validateToken(token));
        assertEquals(email, jwtService.extractEmail(token));
        assertEquals(userId, jwtService.extractUserId(token));
        assertEquals(tenantId, jwtService.extractTenantId(token));
        assertEquals(role, jwtService.extractRole(token));
        assertEquals(name, jwtService.extractName(token));
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    void testInvalidToken() {
        assertFalse(jwtService.validateToken("invalid-token-string"));
    }

    @Test
    void testExpiredToken() {
        ReflectionTestUtils.setField(jwtService, "expirationMs", -1000L); // expired 1s ago
        String token = jwtService.generateToken(
                UUID.randomUUID().toString(),
                "expired@example.com",
                UUID.randomUUID().toString(),
                "ADMIN",
                "Expired User"
        );
        assertNotNull(token);
        assertFalse(jwtService.validateToken(token));
    }
}
