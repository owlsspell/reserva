import { Injectable, Inject } from '@nestjs/common';
import { RESOURCE_REPOSITORY, ResourceRepository } from './resource.repository';

export interface ListResourcesQuery {
  limit?: number;
  cursor?: string;
  type?: string;
  city?: string;
  minCapacity?: number;
  q?: string;
}

@Injectable()
export class ListResourcesUseCase {
  constructor(@Inject(RESOURCE_REPOSITORY) private readonly repository: ResourceRepository) {}

  async execute(query: ListResourcesQuery) {
    return this.repository.findList({
      limit: query.limit ?? 20,
      cursor: query.cursor,
      filters: {
        type: query.type,
        city: query.city,
        minCapacity: query.minCapacity,
        q: query.q,
      },
    });
  }
}
