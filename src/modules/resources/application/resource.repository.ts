import { Resource } from '../domain/resource';

export interface ScheduleItem {
  weekday: number;
  opensAt: string;
  closesAt: string;
}

export interface BlackoutItem {
  id: string;
  startsAt: Date;
  endsAt: Date;
  reason: string;
}

export interface ResourceRepository {
  findById(id: string): Promise<Resource | null>;
  save(resource: Resource): Promise<void>;
  findList(params: {
    limit: number;
    cursor?: string;
    filters: { type?: string; city?: string; minCapacity?: number; q?: string };
  }): Promise<{ data: Resource[]; nextCursor: string | null }>;
  setSchedule(resourceId: string, schedules: ScheduleItem[]): Promise<void>;
  getSchedules(resourceId: string): Promise<ScheduleItem[]>;
  addBlackout(resourceId: string, startsAt: Date, endsAt: Date, reason: string): Promise<string>;
  removeBlackout(blackoutId: string): Promise<void>;
  getBlackouts(resourceId: string): Promise<BlackoutItem[]>;
}

export const RESOURCE_REPOSITORY = Symbol('RESOURCE_REPOSITORY');
