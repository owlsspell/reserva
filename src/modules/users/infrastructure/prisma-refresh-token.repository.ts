import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RefreshTokenRepository } from '../application/ports/refresh-token.repository';
import { RefreshTokenEntity } from '../domain/refresh-token.entity';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(token: RefreshTokenEntity): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        familyId: token.familyId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
        replacedBy: token.replacedBy,
        createdAt: token.createdAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!record) return null;
    return new RefreshTokenEntity(
      record.id,
      record.userId,
      record.familyId,
      record.tokenHash,
      record.expiresAt,
      record.revokedAt,
      record.replacedBy,
      record.createdAt,
    );
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeToken(id: string, replacedBy?: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        replacedBy: replacedBy || null,
      },
    });
  }
}
