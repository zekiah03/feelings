import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // 接続URLはマイグレーション生成時に使う (drizzle-kit generate は不要、push 用)
    url: process.env.DATABASE_URL ?? 'postgresql://localhost/feelings',
  },
} satisfies Config;
