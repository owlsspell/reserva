import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionContext } from './transaction-context';

@Global()
@Module({
  providers: [PrismaService, TransactionContext],
  exports: [PrismaService, TransactionContext],
})
export class DatabaseModule {}
