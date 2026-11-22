import { PasswordHasher } from '../application/ports/password-hasher';
import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
