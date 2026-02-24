import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc/trpc';
import { config } from './config';
import { initWsGateway } from './ws/gateway';
import { logger } from './utils/logger';
import { prisma } from './db/prisma';

const app = express();

app.use(cors());

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.get('/', (req, res) => {
  res.send('ChatUp API running');
});

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.success({ event: 'Database connection established successfully' });
  } catch (err) {
    logger.error({ event: 'Database connection failed' }, err);
    process.exit(1);
  }
}

async function checkS3() {
  try {
    // For MVP, we validate config existence. If using aws-sdk, you'd do a HeadBucket command here.
    if (!config.s3.endpoint || !config.s3.bucket) {
      throw new Error('S3 configuration is missing required parameters');
    }
    logger.success({ 
      event: 'S3 storage config validated', 
      endpoint: config.s3.endpoint, 
      bucket: config.s3.bucket 
    });
  } catch (err) {
    logger.error({ event: 'S3 connection/validation failed' }, err);
    process.exit(1);
  }
}

async function bootstrap() {
  logger.info({ event: 'Starting server bootstrap...' });
  
  await checkDatabase();
  await checkS3();

  const server = app.listen(config.port, () => {
    logger.success({ 
      event: 'Server is successfully running', 
      port: config.port, 
      env: config.env 
    });
  });

  initWsGateway(server);
  logger.info({ event: 'WebSocket Gateway initialized' });
}

bootstrap().catch((err) => {
  logger.error({ event: 'Fatal error during server bootstrap' }, err);
  process.exit(1);
});

