import { Resource } from '../domain/resource';

export interface ResourceRepository {
  findById(id: string): Promise<Resource | null>;
  save(resource: Resource): Promise<void>;
  findList(params: {
    limit: number;
    cursor?: string;
    filters: { type?: string; city?: string; minCapacity?: number; q?: string };
  }): Promise<{ data: Resource[]; nextCursor: string | null }>;
}

export const RESOURCE_REPOSITORY = Symbol('RESOURCE_REPOSITORY');
