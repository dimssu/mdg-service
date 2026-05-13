import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_LOGIN_PER_MIN: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof envSchema> & { CORS_ORIGINS_LIST: string[] };

function load(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`Invalid environment configuration:\n${issues}`);
    throw new Error('Invalid environment configuration');
  }
  const e = parsed.data;
  const list = e.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return { ...e, CORS_ORIGINS_LIST: list };
}

export const env: Env = load();
