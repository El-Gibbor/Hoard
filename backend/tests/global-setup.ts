import { execSync } from 'node:child_process';
import { Client } from 'pg';
import { adminDatabaseUrl, testDatabaseUrl } from './database-url';

export const setup = async (): Promise<void> => {
  const admin = new Client({ connectionString: adminDatabaseUrl() });
  await admin.connect();
  const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', ['hoard_test']);
  if (existing.rowCount === 0) {
    await admin.query('CREATE DATABASE hoard_test');
  }
  await admin.end();

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
  });
};
