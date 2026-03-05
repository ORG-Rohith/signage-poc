import 'dotenv/config';
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "generated/prisma/client";
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || '1234'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'poc'}`;

// Log resolved DB host/port (mask password) to help debug container env issues
try {
  const url = new URL(connectionString);
  const host = url.hostname;
  const port = url.port || '5432';
  const db = url.pathname ? url.pathname.replace(/^\//, '') : '';
  const source = process.env.DATABASE_URL ? 'DATABASE_URL' : 'DB_* variables fallback';
  // avoid printing password
  // eslint-disable-next-line no-console
  console.info(`[Prisma] connecting to db host=${host} port=${port} db=${db} (${source})`);
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('[Prisma] unable to parse connection string for debug output');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}