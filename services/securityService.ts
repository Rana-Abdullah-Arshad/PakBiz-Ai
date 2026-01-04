
/**
 * Security Service
 * Handles encryption and decryption of sensitive configuration data
 * using the Web Crypto API (AES-GCM).
 */

const ALGORITHM = 'AES-GCM';

export const securityService = {
  /**
   * Generates a crypto key from a plain text password (adminSecret)
   */
  async getDerivedKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('pakbiz-salt-2024'), // Static salt for stateless consistency
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: ALGORITHM, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Encrypts a string using the adminSecret
   */
  async encrypt(text: string, secret: string): Promise<string> {
    if (!text) return '';
    try {
      const key = await this.getDerivedKey(secret);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encoder.encode(text)
      );

      // Combine IV and Encrypted data into a single base64 string
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      console.error('Encryption failed', e);
      return '';
    }
  },

  /**
   * Decrypts a string using the adminSecret
   */
  async decrypt(encoded: string, secret: string): Promise<string> {
    if (!encoded) return '';
    try {
      const key = await this.getDerivedKey(secret);
      const combined = new Uint8Array(
        atob(encoded)
          .split('')
          .map((char) => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error('Decryption failed. Secret might be wrong.', e);
      return '';
    }
  }
};
