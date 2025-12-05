import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import { ScenarioType, Prisma } from '@prisma/client';

@Injectable()
export class ScenariosService {
    private readonly logger = new Logger(ScenariosService.name);

    constructor(private prisma: PrismaService) { }

    async createDefaultScenarios(siteId: string) {
        const site = await this.prisma.site.findUnique({ where: { id: siteId } });
        if (!site) throw new NotFoundException('Site not found');

        const sizeAcres = Number(site.sizeAcres);
        const askPriceTotal = Number(site.askPriceTotal);
        // Default net buildable acres = 75% of total
        const netAcres = sizeAcres * 0.75;

        const defaults = [
            { type: ScenarioType.MF_GARDEN_MARKET, density: 25 },
            { type: ScenarioType.MF_GARDEN_LIHTC, density: 25 },
            { type: ScenarioType.BTR_DUPLEX, density: 11 },
            { type: ScenarioType.BTR_ROW_TOWNHOME, density: 15 },
        ];

        const createdScenarios: any[] = [];

        for (const def of defaults) {
            // Check if scenario of this type already exists
            const existing = await this.prisma.scenario.findFirst({
                where: { siteId, scenarioType: def.type },
            });

            if (existing) {
                createdScenarios.push(existing);
                continue;
            }

            const assumedUnits = Math.round(netAcres * def.density);
            const densityUnitsPerAcre = netAcres > 0 ? assumedUnits / netAcres : 0;
            const landPricePerDoor = assumedUnits > 0 ? askPriceTotal / assumedUnits : 0;

            const scenario = await this.prisma.scenario.create({
                data: {
                    siteId,
                    scenarioType: def.type,
                    assumedNetAcres: netAcres,
                    assumedUnits,
                    densityUnitsPerAcre,
                    landPricePerDoor,
                    status: 'TODO',
                },
            });
            createdScenarios.push(scenario);
        }

        return createdScenarios;
    }

    async updateScenario(id: string, dto: UpdateScenarioDto) {
        const scenario = await this.prisma.scenario.findUnique({
            where: { id },
            include: { site: true },
        });

        if (!scenario) throw new NotFoundException('Scenario not found');

        const site = scenario.site;
        const askPriceTotal = Number(site.askPriceTotal);

        // Use new values or fallback to existing
        const assumedNetAcres = dto.assumedNetAcres !== undefined
            ? dto.assumedNetAcres
            : Number(scenario.assumedNetAcres);

        const assumedUnits = dto.assumedUnits !== undefined
            ? dto.assumedUnits
            : scenario.assumedUnits;

        // Recalculate metrics
        const densityUnitsPerAcre = assumedNetAcres > 0 ? assumedUnits / assumedNetAcres : 0;
        const landPricePerDoor = assumedUnits > 0 ? askPriceTotal / assumedUnits : 0;

        return this.prisma.scenario.update({
            where: { id },
            data: {
                assumedNetAcres,
                assumedUnits,
                densityUnitsPerAcre,
                landPricePerDoor,
            },
        });
    }

    async getScenariosBySite(siteId: string) {
        return this.prisma.scenario.findMany({
            where: { siteId },
            orderBy: { scenarioType: 'asc' },
        });
    }
}
