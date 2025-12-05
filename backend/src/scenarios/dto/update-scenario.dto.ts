import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateScenarioDto {
    @IsNumber()
    @IsOptional()
    @Min(0)
    assumedNetAcres?: number;

    @IsInt()
    @IsOptional()
    @Min(0)
    assumedUnits?: number;
}
