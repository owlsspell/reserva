import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export type TxClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

@Injectable()
export class TransactionContext {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx as TxClient);
    });
  }
}
