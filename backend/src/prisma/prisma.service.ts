import { Injectable,OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "generated/prisma/client";
import { Pool } from 'pg';

const pool = new Pool({ connectionString: "postgresql://postgres:1234@localhost:5434/poc" });
const adapter = new PrismaPg(pool);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit{
    constructor() {
    super({ adapter });  // ← pass adapter!
  }
    
    async onModuleInit() {
        await this.$connect();
    }
}