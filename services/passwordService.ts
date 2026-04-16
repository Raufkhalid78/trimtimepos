import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password securely.
 * @param password The plaintext password to hash.
 * @returns The hashed password string.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const ensureHashed = async (password: string): Promise<string> => {
  if (password && (password.startsWith('$2a$') || password.startsWith('$2b$'))) {
    return password;
  }
  return hashPassword(password);
};

/**
 * Verifies a plaintext password against a stored hash.
 * @param password The plaintext password to verify.
 * @param hash The stored hashed password.
 * @returns True if the password matches the hash, false otherwise.
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // If the stored "hash" does not look like a bcrypt hash, it might be a plaintext legacy password
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
    console.warn("Legacy plaintext password detected. This should be migrated.");
    return password === hash;
  }
  return bcrypt.compare(password, hash);
};
