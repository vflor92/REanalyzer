import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SitesModule } from './sites/sites.module';
import { AiModule } from './ai/ai.module';
import { IntakeModule } from './intake/intake.module';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { RentCompsModule } from './rent-comps/rent-comps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AiModule,
    IntakeModule,
    EnrichmentModule,
    SitesModule,
    ScenariosModule,
    RentCompsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
