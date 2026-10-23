import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './tests/database-url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl(),
      ADMIN_EMAIL: 'admin@hoard.test',
      ADMIN_NAME: 'Hoard Admin',
      ADMIN_PASSWORD: 'test-admin-password',
    },
  },
});
