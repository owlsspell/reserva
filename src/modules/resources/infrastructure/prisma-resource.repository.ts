import { Injectable } from '@nestjs/common';
import { ResourceRepository } from '../application/resource.repository';
import { Resource } from '../domain/resource';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  decodeCursor,
  processPaginatedRecords,
} from '../../../infrastructure/database/cursor-pagination.helper';
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

  async setSchedule(
    resourceId: string,
    schedules: { weekday: number; opensAt: string; closesAt: string }[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.resourceSchedule.deleteMany({ where: { resourceId } });
      if (schedules.length > 0) {
        await tx.resourceSchedule.createMany({
          data: schedules.map((s) => ({
            resourceId,
            weekday: s.weekday,
            opensAt: s.opensAt,
            closesAt: s.closesAt,
          })),
        });
      }
    });
  }

  async getSchedules(
    resourceId: string,
  ): Promise<{ weekday: number; opensAt: string; closesAt: string }[]> {
    const records = await this.prisma.resourceSchedule.findMany({
      where: { resourceId },
      orderBy: [{ weekday: 'asc' }, { opensAt: 'asc' }],
    });
    return records.map((r) => ({
      weekday: r.weekday,
      opensAt: r.opensAt,
      closesAt: r.closesAt,
    }));
  }

  async addBlackout(
    resourceId: string,
    startsAt: Date,
    endsAt: Date,
    reason: string,
  ): Promise<string> {
    const blackout = await this.prisma.resourceBlackout.create({
      data: {
        resourceId,
        startsAt,
        endsAt,
        reason,
      },
    });
    return blackout.id;
  }

  async removeBlackout(blackoutId: string): Promise<void> {
    await this.prisma.resourceBlackout.delete({
      where: { id: blackoutId },
    });
  }

  async getBlackouts(
    resourceId: string,
  ): Promise<{ id: string; startsAt: Date; endsAt: Date; reason: string }[]> {
    const records = await this.prisma.resourceBlackout.findMany({
      where: { resourceId },
      orderBy: { startsAt: 'asc' },
    });
    return records.map((r) => ({
      id: r.id,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      reason: r.reason,
    }));
  }
  async findList(params: {
    limit: number;
    cursor?: string;
    filters: { type?: string; city?: string; minCapacity?: number; q?: string };
  }): Promise<{ data: Resource[]; nextCursor: string | null }> {
    const { limit, cursor, filters } = params;

    const decodedCursor = decodeCursor(cursor);

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

    return processPaginatedRecords(records, limit, (r) => this.toDomain(r));
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
