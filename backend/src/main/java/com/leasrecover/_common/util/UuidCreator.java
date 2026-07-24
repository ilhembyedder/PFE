package com.leasrecover._common.util;

import java.security.SecureRandom;
import java.util.UUID;

public class UuidCreator {
    private static final SecureRandom random = new SecureRandom();
    
    public static UUID createUuidV7() {
        long timestamp = System.currentTimeMillis();
        long msb = (timestamp & 0xFFFFFFFFFFFFL) << 16;
        msb |= 0x7000L; // Set version to 7
        msb |= (random.nextInt() & 0x0FFF); // rand_a (12 bits)
        
        long lsb = (random.nextLong() & 0x3FFFFFFFFFFFFFFFL) | 0x8000000000000000L; // variant 2
        return new UUID(msb, lsb);
    }
}
