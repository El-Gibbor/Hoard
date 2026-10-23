import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './tests/database-url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Files share one database, so running them in parallel makes before/after totals unreliable
    fileParallelism: false,
    globalSetup: ['./tests/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl(),
      ADMIN_EMAIL: 'admin@hoard.test',
      ADMIN_NAME: 'Hoard Admin',
      ADMIN_PASSWORD: 'test-admin-password',
      JWT_SECRET: 'test-jwt-secret-must-be-32-characters',
      JWT_EXPIRES_IN: '1d',
    },
  },
});
