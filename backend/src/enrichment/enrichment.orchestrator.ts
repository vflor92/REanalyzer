import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GeocodingService } from './services/geocoding.service';
import { DemographicsService } from './services/demographics.service';
import { ProgramFlagsService } from './services/program-flags.service';

@Injectable()
export class EnrichmentOrchestrator {
    private readonly logger = new Logger(EnrichmentOrchestrator.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geocodingService: GeocodingService,
        private readonly demographicsService: DemographicsService,
        private readonly programFlagsService: ProgramFlagsService,
    ) { }

    /**
     * Enrich a site with data from external services
     * 1. Geocode if lat/lon missing
     * 2. Fetch demographics for 1mi radius
     * 3. Check program flags (QCT, DDA, OZ)
     * Note: Flood zone data is entered manually by users
     */
    async enrichSite(siteId: string) {
        this.logger.log(`Starting enrichment for site ${siteId}`);

        // Fetch site
        const site = await this.prisma.site.findUnique({
            where: { id: siteId },
            include: {
                demographics: true,
                programFlags: true,
                constraints: true,
            },
        });

        if (!site) {
            throw new NotFoundException(`Site with ID ${siteId} not found`);
        }

        let { latitude, longitude } = site;

        // Step 1: Geocode if needed
        if (!latitude || !longitude) {
            this.logger.log('Site missing lat/lon, geocoding...');
            const coords = await this.geocodingService.geocodeAddress(
                site.addressLine1,
                site.city,
                site.state,
            );

            if (coords) {
                latitude = coords.lat;
                longitude = coords.lon;

                // Update site with coordinates
                await this.prisma.site.update({
                    where: { id: siteId },
                    data: {
                        latitude,
                        longitude,
                    },
                });
                this.logger.log(`Geocoded to (${latitude}, ${longitude})`);
            } else {
                this.logger.error('Geocoding failed, cannot enrich without coordinates');
                throw new Error('Failed to geocode address');
            }
        }

        // Run enrichment services in parallel (no flood service)
        const [demographics1mi, programFlags] =
            await Promise.all([
                this.demographicsService.getDemographics(latitude, longitude, 1),
                this.programFlagsService.getProgramFlags(latitude, longitude),
            ]);

        // Step 2: Upsert demographics (1 mile only)
        const existing1mi = await this.prisma.demographics.findFirst({
            where: {
                siteId,
                radiusMiles: 1,
            },
        });

        if (existing1mi) {
            await this.prisma.demographics.update({
                where: { id: existing1mi.id },
                data: {
                    medianHouseholdIncome: demographics1mi.medianHouseholdIncome,
                    population: demographics1mi.population,
                    source: demographics1mi.source,
                    asOfYear: demographics1mi.asOfYear,
                },
            });
        } else {
            await this.prisma.demographics.create({
                data: {
                    siteId,
                    radiusMiles: 1,
                    medianHouseholdIncome: demographics1mi.medianHouseholdIncome,
                    population: demographics1mi.population,
                    source: demographics1mi.source,
                    asOfYear: demographics1mi.asOfYear,
                },
            });
        }

        this.logger.log('Demographics upserted');

        // Step 3: Upsert program flags
        await this.prisma.programFlags.upsert({
            where: { siteId },
            create: {
                siteId,
                inLihtcQct: programFlags.isQct,
                inLihtcDda: programFlags.isDda,
                inOpportunityZone: programFlags.isOpportunityZone,
                programFlagsLastCheckedAt: new Date(),
            },
            update: {
                inLihtcQct: programFlags.isQct,
                inLihtcDda: programFlags.isDda,
                inOpportunityZone: programFlags.isOpportunityZone,
                programFlagsLastCheckedAt: new Date(),
            },
        });

        this.logger.log('Program flags upserted');

        // Fetch and return enriched site (flood zone entered manually by user)
        const enrichedSite = await this.prisma.site.findUnique({
            where: { id: siteId },
            include: {
                demographics: {
                    orderBy: { radiusMiles: 'asc' },
                },
                programFlags: true,
                constraints: true,
            },
        });

        this.logger.log(`Enrichment complete for site ${siteId}`);

        return enrichedSite;
    }
}
