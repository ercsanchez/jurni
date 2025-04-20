import bcrypt from 'bcryptjs';
import appConfig from '@/config/app.config';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, appConfig.PWORD_HASH_SALT_LENGTH);
}

export function hashPasswordSync(password: string) {
  return bcrypt.hashSync(password, appConfig.PWORD_HASH_SALT_LENGTH);
}

export const comparePassword: (
  password: string,
  hashedPassword: string,
) => Promise<boolean> = async (password, hashedPassword) =>
  await bcrypt.compare(password, hashedPassword);
