export class RefreshTokenEntity {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly familyId: string,
    readonly tokenHash: string,
    readonly expiresAt: Date,
    readonly revokedAt: Date | null,
    readonly replacedBy: string | null,
    readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    userId: string,
    familyId: string,
    tokenHash: string,
    expiresAt: Date,
  ): RefreshTokenEntity {
    return new RefreshTokenEntity(
      id,
      userId,
      familyId,
      tokenHash,
      expiresAt,
      null,
      null,
      new Date(),
    );
  }

  isRevoked(): boolean {
    return this.revokedAt !== null || this.replacedBy !== null;
  }

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }
}
