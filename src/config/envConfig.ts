import 'dotenv/config';

type EnvConfig = {
  PORT: number;
  NODE_ENV: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  SYNCHRONIZE_DB: boolean;
  USE_TS_ENTITY_MIGRATION: boolean;
  SENDGRID_API_KEY: string;
  PAYSTACK_SECRET_KEY: string;
  CLIENT_BASE_URL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  EMAIL_HOST: string;
  EMAIL_PORT: number
  USER_EMAIL: string
  EMAIL_PASS: string
};

type ENV = Partial<EnvConfig> & {
  [K in keyof EnvConfig]: EnvConfig[K] | undefined;
};

const getConfig = (): ENV => ({
  PORT: Number(process.env.PORT),
  POSTGRES_PORT: Number(process.env.POSTGRES_PORT),
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_DB: process.env.POSTGRES_DB,
  NODE_ENV: process.env.NODE_ENV,
  SYNCHRONIZE_DB: process.env.SYNCHRONIZE_DB === 'true',
  USE_TS_ENTITY_MIGRATION: process.env.USE_TS_ENTITY_MIGRATION === 'true',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  CLIENT_BASE_URL: process.env.CLIENT_BASE_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: Number(process.env.EMAIL_PORT),
  USER_EMAIL: process.env.USER_EMAIL,
  EMAIL_PASS: process.env.EMAIL_PASS
});

const getSanitizedConfig = (config: ENV): EnvConfig => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in .env`);
    }
  }
  return config as EnvConfig;
};

const config = getConfig();

const sanitizedConfig = getSanitizedConfig(config);

export default sanitizedConfig;
