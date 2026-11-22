import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule,
    HealthModule,
    DatabaseModule,
    UsersModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { translateTime: 'SYS:standard' } }
            : undefined,
        genReqId: (req) => {
          const existingId = req.headers['x-request-id'];
          return (Array.isArray(existingId) ? existingId[0] : existingId) || randomUUID();
        },
        customProps: (req) => ({
          traceId: req.id,
        }),
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers["cookie"]',
            'body.password',
            'body.refreshToken',
            'body.accessToken',
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
