import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  RESOURCE_REPOSITORY,
  ResourceRepository,
  ScheduleItem,
  BlackoutItem,
} from './resource.repository';

export interface ResourceDetailsView {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  city: string;
  timezone: string;
  pricePerHour: number;
  schedules: ScheduleItem[];
  blackouts: BlackoutItem[];
}

@Injectable()
export class GetResourceUseCase {
  constructor(@Inject(RESOURCE_REPOSITORY) private readonly repository: ResourceRepository) {}

  async execute(id: string): Promise<ResourceDetailsView> {
    const resource = await this.repository.findById(id);
    if (!resource || resource.archivedAt) {
      throw new NotFoundException('Resource not found');
    }

    const [schedules, blackouts] = await Promise.all([
      this.repository.getSchedules(id),
      this.repository.getBlackouts(id),
    ]);

    const props = resource.getProps();

    return {
      id: props.id,
      name: props.name,
      description: props.description,
      type: props.type,
      capacity: props.capacity,
      city: props.city,
      timezone: props.timezone,
      pricePerHour: props.pricePerHour,
      schedules,
      blackouts,
    };
  }
}
