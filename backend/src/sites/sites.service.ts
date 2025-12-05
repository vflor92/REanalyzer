import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySitesDto } from './dto/query-sites.dto';
import { Prisma } from '@prisma/client';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SitesService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
    ) { }

    /**
     * Calculate derived fields from site data
     */
    private calculateDerivedFields(sizeAcres: number, askPriceTotal: number) {
        const sizeSf = sizeAcres * 43560; // Convert acres to square feet
        // Avoid division by zero
        const askPricePerSf = sizeSf > 0 ? askPriceTotal / sizeSf : 0;
        return { sizeSf, askPricePerSf };
    }

    /**
     * Find all sites with filtering, sorting, and pagination
     */
    async findAll(query: QuerySitesDto) {
        const { status, state, city, sortBy, sortOrder } = query;
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        // Build where clause for filtering
        const where: Prisma.SiteWhereInput = {};
        if (status) where.status = status;
        if (state) where.state = state;
        if (city) where.city = city;

        // Build orderBy clause for sorting
        const orderBy: Prisma.SiteOrderByWithRelationInput = {};
        const sortField = sortBy || 'createdAt';
        const order = sortOrder || 'DESC';
        orderBy[sortField] = order.toLowerCase();

        // Calculate pagination
        const skip = (page - 1) * limit;
        const take = limit;

        // Execute queries
        const [data, total] = await Promise.all([
            this.prisma.site.findMany({
                where,
                orderBy,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    status: true,
                    sizeAcres: true,
                    askPriceTotal: true,
                    askPricePerSf: true,
                    createdAt: true,
                },
            }),
            this.prisma.site.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Find one site by ID with relations
     */
    async findOne(id: string) {
        const site = await this.prisma.site.findUnique({
            where: { id },
            include: {
                constraints: true,
                utilities: true,
                demographics: {
                    orderBy: { radiusMiles: 'asc' },
                },
                programFlags: true,
                scenarios: {
                    orderBy: {
                        scenarioType: 'asc',
                    },
                },
            },
        });

        if (!site) {
            throw new NotFoundException(`Site with ID ${id} not found`);
        }

        return site;
    }

    /**
     * Create a new site with auto-calculated fields
     */
    async create(createSiteDto: CreateSiteDto) {
        const { sizeAcres = 0, askPriceTotal = 0, constraints, utilities, ...siteData } = createSiteDto;

        // Calculate derived fields
        const { sizeSf, askPricePerSf } = this.calculateDerivedFields(sizeAcres, askPriceTotal);

        // Build nested create data
        const data: Prisma.SiteCreateInput = {
            ...siteData,
            sizeAcres: new Prisma.Decimal(sizeAcres),
            sizeSf: new Prisma.Decimal(sizeSf),
            askPriceTotal: new Prisma.Decimal(askPriceTotal),
            askPricePerSf: new Prisma.Decimal(askPricePerSf),
        };

        if (constraints) {
            data.constraints = { create: constraints };
        }

        if (utilities) {
            data.utilities = { create: utilities };
        }

        return this.prisma.site.create({
            data,
            include: {
                constraints: true,
                utilities: true,
            },
        });
    }

    /**
     * Update a site with recalculation of derived fields
     */
    async update(id: string, updateSiteDto: UpdateSiteDto) {
        // Check if site exists
        const existingSite = await this.findOne(id);

        const { sizeAcres, askPriceTotal, constraints, utilities, floodZoneCode, floodSource, ...siteData } = updateSiteDto;

        // Recalculate derived fields if acres or price changed
        let sizeSf: number = Number(existingSite.sizeSf);
        let askPricePerSf: number = Number(existingSite.askPricePerSf);

        const finalAcres = sizeAcres ?? Number(existingSite.sizeAcres);
        const finalPrice = askPriceTotal ?? Number(existingSite.askPriceTotal);

        if (sizeAcres !== undefined || askPriceTotal !== undefined) {
            const calculated = this.calculateDerivedFields(
                finalAcres,
                finalPrice,
            );
            sizeSf = calculated.sizeSf;
            askPricePerSf = calculated.askPricePerSf;
        }

        // Build update data
        const data: Prisma.SiteUpdateInput = {
            ...siteData,
        };

        if (sizeAcres !== undefined) data.sizeAcres = new Prisma.Decimal(sizeAcres);
        if (askPriceTotal !== undefined) data.askPriceTotal = new Prisma.Decimal(askPriceTotal);
        data.sizeSf = new Prisma.Decimal(sizeSf);
        data.askPricePerSf = new Prisma.Decimal(askPricePerSf);

        // Handle nested updates
        // Merge flood zone fields with constraints
        const constraintsUpdate = {
            ...constraints,
            ...(floodZoneCode !== undefined && { floodZoneCode }),
            ...(floodSource !== undefined && { floodSource }),
        };

        if (Object.keys(constraintsUpdate).length > 0) {
            data.constraints = existingSite.constraints
                ? { update: constraintsUpdate }
                : { create: constraintsUpdate };
        }

        if (utilities) {
            data.utilities = existingSite.utilities
                ? { update: utilities }
                : { create: utilities };
        }

        return this.prisma.site.update({
            where: { id },
            data,
            include: {
                constraints: true,
                utilities: true,
            },
        });
    }

    /**
     * Delete a site (cascade deletes relations automatically)
     */
    async remove(id: string) {
        await this.findOne(id); // Check if exists
        return this.prisma.site.delete({ where: { id } });
    }

    /**
     * Generate and save AI deal summary
     */
    async generateAndSaveSummary(id: string) {
        const site = await this.findOne(id);

        // Prepare data for AI (exclude internal IDs and timestamps where possible to save tokens)
        // We can pass the whole object, but let's clean it up slightly if needed.
        // For now, passing the full object is fine as Llama 3.3 has a large context window.
        const summary = await this.aiService.generateDealSummary(site);

        // Update site with new summary
        return this.prisma.site.update({
            where: { id },
            data: {
                summaryPros: summary.pros,
                summaryCons: summary.cons,
                summaryOverview: summary.overview,
            },
            include: {
                constraints: true,
                utilities: true,
                demographics: true,
                programFlags: true,
                scenarios: true,
            },
        });
    }
}
