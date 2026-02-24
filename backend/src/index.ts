import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc/trpc';
import { config } from './config';
import { initWsGateway } from './ws/gateway';
import { logger } from './utils/logger';
import { prisma } from './db/prisma';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

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
    const dbUrl = new URL(config.db.url);
    const rows = await prisma.$queryRaw<Array<{ currentUser: string; currentDb: string | null }>>`
      SELECT CURRENT_USER() AS currentUser, DATABASE() AS currentDb
    `;
    const dbInfo = rows[0];
    logger.success({
      event: 'MySQL connection established and credentials validated',
      host: dbUrl.hostname,
      port: dbUrl.port || '3306',
      expectedUser: decodeURIComponent(dbUrl.username),
      authenticatedAs: dbInfo?.currentUser ?? 'unknown',
      database: dbInfo?.currentDb ?? dbUrl.pathname.replace('/', ''),
    });
  } catch (err) {
    logger.error({ event: 'Database connection failed' }, err);
    process.exit(1);
  }
}

async function checkS3() {
  const s3Client = new S3Client({
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  });

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
    logger.success({
      event: 'S3 connection established and credentials validated',
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      bucket: config.s3.bucket,
      accessKeyIdPrefix: `${config.s3.accessKeyId.slice(0, 4)}***`,
    });
  } catch (err) {
    logger.warn(
      {
        event: 'S3 credentials/connectivity not validated',
        endpoint: config.s3.endpoint,
        region: config.s3.region,
        bucket: config.s3.bucket,
      },
      { reason: err instanceof Error ? err.message : String(err) }
    );
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

