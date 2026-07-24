const getSecret = () => {
    const secret = process.env.BFF_COOKIE_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('BFF_COOKIE_SECRET environment variable is required in production');
        }
        console.warn('[SECURITY WARNING] BFF_COOKIE_SECRET environment variable is missing. Using development fallback secret.');
        return 'a-default-extremely-secure-and-long-secret-key-32-chars';
    }
    return secret;
};

// Helper to get the CryptoKey using SHA-256 hash of the secret
async function getCryptoKey() {
    const keyData = new TextEncoder().encode(getSecret());
    const hash = await crypto.subtle.digest('SHA-256', keyData);
    return await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a plaintext string using AES-GCM.
 * Returns a string formatted as IV_HEX:CIPHERTEXT_HEX.
 */
export async function encrypt(text) {
    try {
        const key = await getCryptoKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedText = new TextEncoder().encode(text);
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encodedText
        );

        // Convert IV and ciphertext to hex
        const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
        const encryptedBytes = new Uint8Array(encrypted);
        const cipherTextHex = Array.from(encryptedBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        
        return `${ivHex}:${cipherTextHex}`;
    } catch (e) {
        console.error('Encryption error:', e);
        throw e;
    }
}

/**
 * Decrypts an encrypted string (IV_HEX:CIPHERTEXT_HEX) using AES-GCM.
 * Returns the decrypted plaintext string, or null/throws on error.
 */
export async function decrypt(encryptedText) {
    try {
        if (!encryptedText || !encryptedText.includes(':')) {
            return null;
        }
        
        const [ivHex, cipherTextHex] = encryptedText.split(':');
        
        // Parse hex strings
        const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const cipherText = new Uint8Array(cipherTextHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        
        const key = await getCryptoKey();
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            cipherText
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error('Decryption error:', e);
        return null;
    }
}
