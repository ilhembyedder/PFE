package com.leasrecover.backend;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    @Test
    public void generateHashes() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("HASH_ADMIN: " + encoder.encode("admin"));
        System.out.println("HASH_ADMIN8: " + encoder.encode("admin8"));
        System.out.println("HASH_PASSWORD: " + encoder.encode("password"));
        System.out.println("HASH_SUPER123: " + encoder.encode("Super123"));
        System.out.println("HASH_ILHEM123: " + encoder.encode("ilhem123"));
    }
}
