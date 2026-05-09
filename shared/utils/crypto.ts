import crypto from 'crypto';

export function generateId(length = 21): string {
  return crypto.randomBytes(length).toString('base64url');
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function hashString(text: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  return crypto.createHash(algorithm).update(text).digest('hex');
}

export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function compareHash(data: string, hash: string): boolean {
  return generateHash(data) === hash;
}

export function encrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string, key: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function generateApiKey(prefix = 'vl'): string {
  const randomPart = crypto.randomBytes(32).toString('base64url');
  return `${prefix}_${randomPart}`;
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

export function generateRandomString(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
