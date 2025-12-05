import { Module } from '@nestjs/common';
import { RentCompsService } from './rent-comps.service';
import { RentCompsController } from './rent-comps.controller';
import { PrismaService } from '../prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [AiModule],
    controllers: [RentCompsController],
    providers: [RentCompsService, PrismaService],
    exports: [RentCompsService],
})
export class RentCompsModule { }
