import { DataSource, DataSourceOptions } from 'typeorm';

import 'reflect-metadata';

import envConfig from './config/envConfig';

//  const syncDatabase = envConfig.SYNCHRONIZE_DB;
const syncDatabase = envConfig.NODE_ENV === 'production' ? false : envConfig.SYNCHRONIZE_DB;

// const syncDatabase = false;
const useTsEntityMigration = envConfig.USE_TS_ENTITY_MIGRATION;

const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: envConfig.POSTGRES_HOST,
  port: envConfig.POSTGRES_PORT,
  username: envConfig.POSTGRES_USER,
  password: envConfig.POSTGRES_PASSWORD,
  database: envConfig.POSTGRES_DB,
  synchronize: syncDatabase,
  logging: false,
  entities: useTsEntityMigration ? ['src/entities/**/*.ts'] : ['dist/entities/**/*.js'],
  migrations: useTsEntityMigration ? ['src/migrations/**/*.ts'] : ['dist/migrations/**/*.js'],
  subscribers: []
};

export const testDatabaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 2345,
  username: 'root',
  database: 'test',
  password: 'easypass',
  synchronize: true,
  dropSchema: true,
  entities: ['src/entities/**/*.ts']
};

const AppDataSource = new DataSource(databaseConfig);
const TestDataSource = new DataSource(testDatabaseConfig);

export default { AppDataSource, TestDataSource };
