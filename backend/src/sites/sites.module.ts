import { Module } from '@nestjs/common';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';
import { PrismaService } from '../prisma.service';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { ScenariosModule } from '../scenarios/scenarios.module';

import { AiModule } from '../ai/ai.module';

@Module({
    imports: [EnrichmentModule, ScenariosModule, AiModule],
    controllers: [SitesController],
    providers: [SitesService, PrismaService],
})
export class SitesModule { }
