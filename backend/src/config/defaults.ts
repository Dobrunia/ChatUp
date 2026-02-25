// Safe fallbacks ONLY for local development. Never use in production.
export const defaults = {
  env: 'development',
  port: 3000,
  db: {
    // A safe local database URL fallback
    url: 'mysql://root:password@localhost:3306/chatup_dev',
  },
  jwt: {
    accessSecret: 'dev-secret-access-key-do-not-use-in-prod',
    refreshSecret: 'dev-secret-refresh-key-do-not-use-in-prod',
    accessExpiresIn: '15m',
    refreshExpiresIn: '30d',
  },
  s3: {
    endpoint: 'https://s3.yandexcloud.net',
    accessKeyId: 'dev-key',
    secretAccessKey: 'dev-secret',
    bucket: 'chatup-dev-bucket',
    region: 'ru-central1',
  },
  webPush: {
    publicKey: '',
    privateKey: '',
    subject: 'mailto:dev@chatup.local',
  },
  firebase: {
    serviceAccountJson: '',
    serviceAccountBase64: '',
  }
};
