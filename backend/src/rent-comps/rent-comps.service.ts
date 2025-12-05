import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRentCompDto } from './dto/create-rent-comp.dto';
import { UpdateRentCompDto } from './dto/update-rent-comp.dto';
import { AiService } from '../ai/ai.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RentCompsService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
    ) { }

    async create(siteId: string, createRentCompDto: CreateRentCompDto) {
        // Verify site exists
        const site = await this.prisma.site.findUnique({ where: { id: siteId } });
        if (!site) throw new NotFoundException('Site not found');

        const data: Prisma.RentCompCreateInput = {
            ...createRentCompDto,
            site: { connect: { id: siteId } },
            averageRentPsf: createRentCompDto.averageRentPsf ? new Prisma.Decimal(createRentCompDto.averageRentPsf) : undefined,
            rentRangeLow: createRentCompDto.rentRangeLow ? new Prisma.Decimal(createRentCompDto.rentRangeLow) : undefined,
            rentRangeHigh: createRentCompDto.rentRangeHigh ? new Prisma.Decimal(createRentCompDto.rentRangeHigh) : undefined,
            distanceMiles: createRentCompDto.distanceMiles ? new Prisma.Decimal(createRentCompDto.distanceMiles) : undefined,
        };

        return this.prisma.rentComp.create({ data });
    }

    async findAll(siteId: string) {
        return this.prisma.rentComp.findMany({
            where: { siteId },
            orderBy: { distanceMiles: 'asc' },
        });
    }

    async update(id: string, updateRentCompDto: UpdateRentCompDto) {
        const comp = await this.prisma.rentComp.findUnique({ where: { id } });
        if (!comp) throw new NotFoundException('Rent comp not found');

        const data: Prisma.RentCompUpdateInput = {
            ...updateRentCompDto,
            averageRentPsf: updateRentCompDto.averageRentPsf ? new Prisma.Decimal(updateRentCompDto.averageRentPsf) : undefined,
            rentRangeLow: updateRentCompDto.rentRangeLow ? new Prisma.Decimal(updateRentCompDto.rentRangeLow) : undefined,
            rentRangeHigh: updateRentCompDto.rentRangeHigh ? new Prisma.Decimal(updateRentCompDto.rentRangeHigh) : undefined,
            distanceMiles: updateRentCompDto.distanceMiles ? new Prisma.Decimal(updateRentCompDto.distanceMiles) : undefined,
        };

        return this.prisma.rentComp.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        const comp = await this.prisma.rentComp.findUnique({ where: { id } });
        if (!comp) throw new NotFoundException('Rent comp not found');

        return this.prisma.rentComp.delete({ where: { id } });
    }

    async summarize(id: string) {
        const comp = await this.prisma.rentComp.findUnique({ where: { id } });
        if (!comp) throw new NotFoundException('Rent comp not found');

        // Prepare data for AI (exclude internal IDs)
        const compData = {
            name: comp.compName,
            type: comp.compType,
            rentPerSf: comp.averageRentPsf?.toString(),
            rentRange: `${comp.rentRangeLow?.toString() || '?'} - ${comp.rentRangeHigh?.toString() || '?'}`,
            distance: `${comp.distanceMiles?.toString() || '?'} miles`,
            currentNotes: comp.notes,
        };

        const summary = await this.aiService.generateCompSummary(compData);

        // Update the comp with the new summary
        return this.prisma.rentComp.update({
            where: { id },
            data: { notes: summary },
        });
    }
}
