import { createCipheriv, randomBytes } from "crypto";

/** Bytes — AES-256-GCM standard; keep in sync with WelTel matchJwtToUser */
export const IV_LENGTH = 12;

/** Encoding of the outgoing encrypted token */
export const TOKEN_ENCODING = "hex" as const;

/**
 * Encrypts a JWT string using AES-256-GCM.
 * Layout: IV (12 bytes) + authTag (16 bytes) + ciphertext, as hex.
 */
export function encryptJwt(jwt: string, encryptionKeyHex: string): string {
  const key = Buffer.from(encryptionKeyHex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "encryptionKey must be a 32-byte hex string (64 hex characters)",
    );
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(jwt, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString(TOKEN_ENCODING);
}
