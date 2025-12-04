
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private prisma: PrismaClient;

    constructor(config: ConfigService) {
        const connectionString = config.get<string>('DATABASE_URL');
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);

        this.prisma = new PrismaClient({
            adapter,
            log: ['info', 'warn', 'error']
        });
    }

    async onModuleInit() {
        await this.prisma.$connect();
    }

    async onModuleDestroy() {
        await this.prisma.$disconnect();
    }

    // Proxy all Prisma methods
    get site() {
        return this.prisma.site;
    }

    get siteConstraints() {
        return this.prisma.siteConstraints;
    }

    get siteUtilities() {
        return this.prisma.siteUtilities;
    }

    get demographics() {
        return this.prisma.demographics;
    }

    get programFlags() {
        return this.prisma.programFlags;
    }

    get rentComp() {
        return this.prisma.rentComp;
    }

    get scenario() {
        return this.prisma.scenario;
    }
}
