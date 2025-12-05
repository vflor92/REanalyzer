import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GeocodingService } from './services/geocoding.service';
import { DemographicsService } from './services/demographics.service';
import { ProgramFlagsService } from './services/program-flags.service';
import { EnrichmentOrchestrator } from './enrichment.orchestrator';

@Module({
    providers: [
        PrismaService,
        GeocodingService,
        DemographicsService,
        ProgramFlagsService,
        EnrichmentOrchestrator,
    ],
    exports: [EnrichmentOrchestrator],
})
export class EnrichmentModule { }
