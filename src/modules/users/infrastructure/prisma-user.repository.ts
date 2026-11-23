import { Injectable } from '@nestjs/common';
import { UserRepository } from '../application/ports/user.repository';
import { User } from '../domain/user.entity';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!record) return null;

    return new User(
      record.id,
      record.email,
      record.passwordHash,
      record.name,
      record.role,
      record.createdAt,
    );
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!record) return null;

    return new User(
      record.id,
      record.email,
      record.passwordHash,
      record.name,
      record.role,
      record.createdAt,
    );
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  }
}
