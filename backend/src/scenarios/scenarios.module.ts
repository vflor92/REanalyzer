import { Module } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { ScenariosController } from './scenarios.controller';
import { PrismaService } from '../prisma.service';

@Module({
    imports: [],
    controllers: [ScenariosController],
    providers: [ScenariosService, PrismaService],
    exports: [ScenariosService],
})
export class ScenariosModule { }
