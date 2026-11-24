import { Injectable } from '@nestjs/common';
import { ResourceRepository } from '../application/resource.repository';
import { Resource } from '../domain/resource';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Resource as PrismaResourceModel } from '@prisma/client';

@Injectable()
export class PrismaResourceRepository implements ResourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Resource | null> {
    const record = await this.prisma.resource.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async save(resource: Resource): Promise<void> {
    const props = resource.getProps();
    await this.prisma.resource.upsert({
      where: { id: props.id },
      create: {
        id: props.id,
        name: props.name,
        description: props.description,
        type: props.type,
        capacity: props.capacity,
        city: props.city,
        timezone: props.timezone,
        pricePerHour: props.pricePerHour,
        archivedAt: props.archivedAt,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      update: {
        name: props.name,
        description: props.description,
        type: props.type,
        capacity: props.capacity,
        city: props.city,
        timezone: props.timezone,
        pricePerHour: props.pricePerHour,
        archivedAt: props.archivedAt,
        updatedAt: props.updatedAt,
      },
    });
  }

  async findList(params: {
    limit: number;
    cursor?: string;
    filters: { type?: string; city?: string; minCapacity?: number; q?: string };
  }): Promise<{ data: Resource[]; nextCursor: string | null }> {
    const { limit, cursor, filters } = params;

    const decodedCursor = cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : undefined;

    const where = {
      type: filters.type,
      city: filters.city,
      capacity: filters.minCapacity ? { gte: filters.minCapacity } : undefined,
      name: filters.q ? { contains: filters.q, mode: 'insensitive' as const } : undefined,
      archivedAt: null,
      id: decodedCursor ? { lt: decodedCursor.id } : undefined,
    };

    const records = await this.prisma.resource.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    const hasMore = records.length > limit;
    const data = records.slice(0, limit);
    const lastItem = data[data.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? Buffer.from(JSON.stringify({ id: lastItem.id })).toString('base64')
        : null;

    return { data: data.map((r) => this.toDomain(r)), nextCursor };
  }

  private toDomain(record: PrismaResourceModel): Resource {
    return Resource.createFromPersistence({
      id: record.id,
      name: record.name,
      description: record.description,
      type: record.type,
      capacity: record.capacity,
      city: record.city,
      timezone: record.timezone,
      pricePerHour: record.pricePerHour,
      archivedAt: record.archivedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
