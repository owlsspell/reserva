import { RefreshTokenEntity } from '../../domain/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepository {
  save(token: RefreshTokenEntity): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  revokeFamily(familyId: string): Promise<void>;
  revokeToken(id: string, replacedBy?: string): Promise<void>;
}
