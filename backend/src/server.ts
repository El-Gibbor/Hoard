import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`Hoard API listening on port ${env.PORT}`);
});

// Containers stop with SIGTERM; finish open requests and release database connections before exiting
const shutdown = (signal: NodeJS.Signals) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    prisma
      .$disconnect()
      .catch((error: unknown) => console.error('Error disconnecting from the database', error))
      .finally(() => process.exit(0));
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
