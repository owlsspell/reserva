import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: '3000',
    LOG_LEVEL: 'debug',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    JWT_ACCESS_TTL_SECONDS: '900',
    JWT_REFRESH_TTL_SECONDS: '604800',
    HOLD_TTL_SECONDS: '600',
    MAX_ACTIVE_HOLDS_PER_USER: '3',
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_123',
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    MAIL_FROM: 'Slotly <no-reply@slotly.local>',
    CORS_ORIGINS: 'http://localhost:5173',
  };

  it('should validate and coerce valid environment variables', () => {
    const result = validateEnv(validEnv);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
  });

  it('should throw on invalid environment variables', () => {
    const invalidEnv = {
      ...validEnv,
      JWT_ACCESS_SECRET: 'too-short',
    };
    expect(() => validateEnv(invalidEnv)).toThrow();
  });
});
