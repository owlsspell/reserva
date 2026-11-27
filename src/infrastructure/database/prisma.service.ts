import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const DEFAULT_POOL_MAX = 10; // pg default, production behavior unchanged

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    // Pool size is configured via DB_POOL_MAX (set to 50 in concurrency tests).
    const rawMax = Number(configService.get('DB_POOL_MAX') ?? DEFAULT_POOL_MAX);
    const max = Number.isInteger(rawMax) && rawMax > 0 ? rawMax : DEFAULT_POOL_MAX;

    const pool = new Pool({ connectionString, max });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
