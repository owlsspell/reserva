import { randomUUID } from 'crypto';

export interface ResourceProps {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  city: string;
  timezone: string;
  pricePerHour: number;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Resource {
  private constructor(private props: ResourceProps) {}

  static create(
    props: Omit<ResourceProps, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt'>,
  ): Resource {
    return new Resource({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
    });
  }

  static createFromPersistence(props: ResourceProps): Resource {
    return new Resource(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get archivedAt(): Date | null | undefined {
    return this.props.archivedAt;
  }

  archive(): void {
    if (this.props.archivedAt) throw new Error('Resource already archived');
    this.props.archivedAt = new Date();
    this.props.updatedAt = new Date();
  }

  update(props: Partial<Omit<ResourceProps, 'id' | 'createdAt' | 'updatedAt'>>): void {
    this.props = { ...this.props, ...props, updatedAt: new Date() };
  }

  getProps(): ResourceProps {
    return { ...this.props };
  }
}
