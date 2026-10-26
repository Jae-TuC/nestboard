import * as bycrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bycrypt.genSalt(SALT_ROUNDS);
  
  return bycrypt.hash(password, salt);
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bycrypt.compare(password, hash);
}