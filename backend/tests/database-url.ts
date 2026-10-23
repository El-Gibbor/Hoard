const fallback = 'postgresql://hoard:hoard@127.0.0.1:5433/hoard';

export const testDatabaseUrl = (): string => {
  const url = new URL(process.env.DATABASE_URL ?? fallback);
  url.pathname = '/hoard_test';
  return url.toString();
};

export const adminDatabaseUrl = (): string => {
  const url = new URL(testDatabaseUrl());
  url.pathname = '/postgres';
  return url.toString();
};
