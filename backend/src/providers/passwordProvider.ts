import argon2 from 'argon2'
import bcrypt from 'bcryptjs'
export interface PasswordProvider {
  hash(password: string): Promise<string>
  verify(hash: string, password: string): Promise<boolean>
}
export const passwordProvider: PasswordProvider = {
  hash: (password) => argon2.hash(password, { type: argon2.argon2id }),
  verify: (hash, password) =>
    hash.startsWith('$argon2') ? argon2.verify(hash, password) : bcrypt.compare(password, hash),
}
